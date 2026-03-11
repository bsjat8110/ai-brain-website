/**
 * AI Brain - Persistent Topic & Knowledge Graph Memory System
 * A lightweight, local-storage JSON database that acts as a cognitive architecture for the AI.
 */

const STORAGE_KEY = 'aiData_brain_graph';
const MAX_MEMORY_NODES = 50;
const MAX_FACTS = 100;

// Initialize blank memory structure if not exists
function getMemory() {
  const defaultMemory = {
    facts: [], // Array of string facts (e.g. "User name is John")
    knowledgeGraph: [], // Array of { subject, predicate, object }
    topics: [] // Array of string topics
  };
  try {
    const mem = localStorage.getItem(STORAGE_KEY);
    return mem ? JSON.parse(mem) : defaultMemory;
  } catch (e) {
    return defaultMemory;
  }
}

function saveMemory(memory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error("Memory Brain Storage Limit Exceeded");
  }
}

/**
 * Searches the local JSON memory graph for keywords relevant to the user's latest message.
 * Extracts a concise context string to be injected into the AI's system prompt.
 * @param {string} userMessage The current prompt from the user.
 * @returns {string} Compact formatted memory context.
 */
export function retrieveContext(userMessage) {
  try {
    const memory = getMemory();
    if (!memory.facts.length && !memory.knowledgeGraph.length && !memory.topics.length) return "";

    const queryWords = userMessage.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    if (queryWords.length === 0) return "";

    let relevantFacts = new Set();
    let relevantGraph = new Set();
    
    // Keyword matching across the JSON graph
    queryWords.forEach(word => {
      // Search facts
      memory.facts.forEach(fact => {
        if (fact.toLowerCase().includes(word)) relevantFacts.add(fact);
      });
      // Search knowledge graph edges
      memory.knowledgeGraph.forEach(edge => {
        if (edge.subject.toLowerCase().includes(word) || edge.object.toLowerCase().includes(word)) {
          relevantGraph.add(`${edge.subject} -> ${edge.predicate} -> ${edge.object}`);
        }
      });
    });

    let contextArr = [];
    if (relevantFacts.size > 0) {
      contextArr.push("KNOWN FACTS:\n" + Array.from(relevantFacts).slice(-5).map(f => `- ${f}`).join("\n"));
    }
    if (relevantGraph.size > 0) {
      contextArr.push("KNOWLEDGE GRAPH RECALL:\n" + Array.from(relevantGraph).slice(-5).map(n => `- ${n}`).join("\n"));
    }
    
    if (memory.topics.length > 0) {
      contextArr.push(`ACTIVE TOPICS: ${memory.topics.slice(-5).join(", ")}`);
    }

    if (contextArr.length > 0) {
      return `\n\n[PERSISTENT MEMORY RECALL]\nUse the following stored memory to personalize the response if relevant to the user query:\n${contextArr.join("\n\n")}`;
    }
    return "";
  } catch (error) {
    console.warn("Memory Retrieval Failed:", error);
    return ""; // Failsafe: Never crash the chat
  }
}

/**
 * Parses an AI's background extraction response and merges it into local storage.
 * It strictly controls size to prevent bloat.
 * Expected JSON Array Format: 
 * { "facts": ["..."], "topics": ["..."], "graph": [{"subject":"", "predicate":"", "object":""}] }
 */
export function mergeKnowledge(jsonString) {
  try {
    // Robustly extract JSON block by finding the first '{' and last '}'
    const start = jsonString.indexOf('{');
    const end = jsonString.lastIndexOf('}');
    if (start === -1 || end === -1) return; // No JSON found

    const cleanJsonString = jsonString.substring(start, end + 1);
    const extraction = JSON.parse(cleanJsonString);
    let memory = getMemory();

    if (extraction.facts && Array.isArray(extraction.facts)) {
      memory.facts = [...new Set([...memory.facts, ...extraction.facts])].slice(-MAX_FACTS);
    }
    if (extraction.topics && Array.isArray(extraction.topics)) {
      memory.topics = [...new Set([...memory.topics, ...extraction.topics])].slice(-20);
    }
    if (extraction.graph && Array.isArray(extraction.graph)) {
        // Unique edges based on subject+predicate+object
        const existingEdges = new Set(memory.knowledgeGraph.map(e => `${e.subject}|${e.predicate}|${e.object}`));
        extraction.graph.forEach(edge => {
            if (edge.subject && edge.predicate && edge.object) {
                const key = `${edge.subject}|${edge.predicate}|${edge.object}`;
                if (!existingEdges.has(key)) {
                    memory.knowledgeGraph.push(edge);
                    existingEdges.add(key);
                }
            }
        });
        // Limit total edge count
        if (memory.knowledgeGraph.length > MAX_MEMORY_NODES) {
            memory.knowledgeGraph = memory.knowledgeGraph.slice(-MAX_MEMORY_NODES);
        }
    }
    
    saveMemory(memory);
  } catch (error) {
    console.warn("Memory Extraction Parsing Failed:", error);
  }
}

/**
 * The system prompt sent to the AI router for background inference to force it to return strict JSON extraction.
 */
export const EXTRACTION_PROMPT = `Analyze the following conversational exchange.
Identify important facts about the user, underlying topics, and structured relationships.
Return ONLY valid JSON in the exact format below, with NO markdown formatting or wrapping backticks. Do not include any conversational text.
If there is no meaningful information to extract, return {"facts":[], "topics":[], "graph":[]}.

{
  "facts": ["list of meaningful facts about user or context"],
  "topics": ["list of 1-3 word topic tags"],
  "graph": [
     {"subject": "Concept 1", "predicate": "relationship", "object": "Concept 2"}
  ]
}`;
