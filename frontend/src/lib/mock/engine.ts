/**
 * Mock EduNexus backend.
 *
 * A deterministic stand-in for the notebook pipeline (router -> retrieval -> generation)
 * so the UI can be demonstrated without a running server. It operates on the same
 * synthetic dataset and returns responses in the exact `/ask` contract shape.
 * It is NOT the real system: routing and answers are rule-based approximations.
 */

import type { AskResponse, ExactRecord, GraphPath, GraphRecord, Route, VectorRecord } from "../types";
import { NO_INFO_ANSWER } from "../constants";
import { classes, departments, documents, students, teachers } from "./dataset";

const lower = (s: string) => s.toLowerCase();
const listJoin = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/* ---------------- entity detection ---------------- */

function findIn(q: string, names: string[]) {
  return names.filter((n) => q.includes(lower(n)));
}

function detectEntities(question: string) {
  const q = lower(question);
  return {
    teachers: findIn(q, teachers.map((t) => t.name)),
    students: findIn(q, students.map((s) => s.name)),
    classes: findIn(q, classes.map((c) => c.class)),
    departments: findIn(q, departments).filter(
      // "Mathematics"/"English" also name subjects; only treat as department with context
      (d) => /department|head|belong|member|teachers? in/.test(q) || d === "Science" || d === "Social Studies",
    ),
  };
}

/* ---------------- router ---------------- */

const LOOKUP_INTENT = /^\s*(?:(?:can|could|would) you (?:please )?)?(find|search( for)?|look\s?up|lookup|who is|identify|locate)\b/i;
const RELATION_WORDS = /(teach|taught|instruct|class|attend|enrol|department|head|belong|subject|students?|taking|part of|member)/;

function scoreDocuments(question: string) {
  const q = lower(question);
  return documents
    .map((doc) => ({ doc, hits: doc.keywords.filter((k) => q.includes(k)).length }))
    .sort((a, b) => b.hits - a.hits);
}

function mockRoute(question: string): Route {
  const q = lower(question);
  const people = [...teachers.map((t) => t.name), ...students.map((s) => s.name)];
  const withoutNames = people.reduce((acc, n) => acc.replace(lower(n), ""), q);

  if (LOOKUP_INTENT.test(q) && !RELATION_WORDS.test(withoutNames)) return "EXACT";
  // VECTOR wins for policies/incidents/events even when graph entities are mentioned.
  if (scoreDocuments(question)[0].hits > 0) return "VECTOR";

  const e = detectEntities(question);
  if (e.teachers.length || e.students.length || e.classes.length || e.departments.length) return "GRAPH";
  return "VECTOR";
}

/* ---------------- GRAPH ---------------- */

interface GraphResult {
  retrieved: GraphRecord[];
  answer: string;
  cypher: string;
  paths: GraphPath[];
}

const node = (name: string, label: string) => ({ name, label });
const fwd = (type: string) => ({ type, direction: "forward" as const });
const back = (type: string) => ({ type, direction: "backward" as const });

function graphRetrieve(question: string): GraphResult | null {
  const q = lower(question);
  const e = detectEntities(question);
  const asks = (re: RegExp) => re.test(q);

  const teacher = e.teachers[0] && teachers.find((t) => t.name === e.teachers[0]);
  const student = e.students[0] && students.find((s) => s.name === e.students[0]);
  const klass = e.classes[0] && classes.find((c) => c.class === e.classes[0]);
  const dept = e.departments[0];

  if (teacher) {
    if (asks(/head|chair|lead/)) {
      const head = teachers.find((t) => t.department === teacher.department && t.head)!;
      return {
        retrieved: [{ department_head: head.name }],
        answer:
          head.name === teacher.name
            ? `${head.name} belongs to the ${head.department} department and is its head.`
            : `${head.name} heads the ${teacher.department} department that ${teacher.name} belongs to.`,
        cypher: `MATCH (t:Teacher {name: "${teacher.name}"})\n-[:BELONGS_TO]->(d:Department)\n<-[:HEADS]-(h:Teacher)\nRETURN h.name AS department_head`,
        paths: [
          {
            nodes: [node(teacher.name, "Teacher"), node(teacher.department, "Department"), node(head.name, "Teacher")],
            relationships: [fwd("BELONGS_TO"), back("HEADS")],
          },
        ],
      };
    }
    if (asks(/department|belong|part of|member/)) {
      return {
        retrieved: [{ department: teacher.department }],
        answer: `${teacher.name} belongs to the ${teacher.department} department.`,
        cypher: `MATCH (t:Teacher {name: "${teacher.name}"})-[:BELONGS_TO]->(d:Department)\nRETURN d.name AS department`,
        paths: [{ nodes: [node(teacher.name, "Teacher"), node(teacher.department, "Department")], relationships: [fwd("BELONGS_TO")] }],
      };
    }
    if (asks(/teach|class/)) {
      const taught = classes.filter((c) => c.teacher === teacher.name);
      return {
        retrieved: taught.map((c) => ({ class: c.class })),
        answer: `${teacher.name} teaches ${listJoin(taught.map((c) => c.class))}.`,
        cypher: `MATCH (t:Teacher {name: "${teacher.name}"})-[:TEACHES]->(c:Class)\nRETURN c.name AS class`,
        paths: taught.map((c) => ({ nodes: [node(teacher.name, "Teacher"), node(c.class, "Class")], relationships: [fwd("TEACHES")] })),
      };
    }
  }

  if (student) {
    if (asks(/teach|taught|instruct/)) {
      const rows = student.classes.map((cn) => classes.find((c) => c.class === cn)!);
      return {
        retrieved: rows.map((c) => ({ teacher: c.teacher })),
        answer: `${listJoin(rows.map((c) => c.teacher))} teach ${student.name}.`,
        cypher: `MATCH (s:Student {name: "${student.name}"})\n-[:ENROLLED_IN]->(c:Class)\n<-[:TEACHES]-(t:Teacher)\nRETURN t.name AS teacher`,
        paths: rows.map((c) => ({
          nodes: [node(student.name, "Student"), node(c.class, "Class"), node(c.teacher, "Teacher")],
          relationships: [fwd("ENROLLED_IN"), back("TEACHES")],
        })),
      };
    }
    if (asks(/class|attend|enrol|taking|take|course|subject/)) {
      return {
        retrieved: student.classes.map((c) => ({ class: c })),
        answer: `${student.name} attends ${listJoin(student.classes)}.`,
        cypher: `MATCH (s:Student {name: "${student.name}"})-[:ENROLLED_IN]->(c:Class)\nRETURN c.name AS class`,
        paths: student.classes.map((c) => ({ nodes: [node(student.name, "Student"), node(c, "Class")], relationships: [fwd("ENROLLED_IN")] })),
      };
    }
  }

  if (klass) {
    if (asks(/student|enrol|attend|who is in|who takes|roster/)) {
      const enrolled = students.filter((s) => s.classes.includes(klass.class)).map((s) => s.name);
      return {
        retrieved: enrolled.map((name) => ({ student: name })),
        answer: `${enrolled.length} students are enrolled in ${klass.class}: ${listJoin(enrolled)}.`,
        cypher: `MATCH (s:Student)-[:ENROLLED_IN]->(c:Class {name: "${klass.class}"})\nRETURN s.name AS student`,
        paths: [{ nodes: [node(`${enrolled.length} students`, "Student"), node(klass.class, "Class")], relationships: [fwd("ENROLLED_IN")] }],
      };
    }
    if (asks(/subject/)) {
      return {
        retrieved: [{ subject: klass.subject }],
        answer: `${klass.class} is a ${klass.subject} class.`,
        cypher: `MATCH (c:Class {name: "${klass.class}"})-[:FOR_SUBJECT]->(s:Subject)\nRETURN s.name AS subject`,
        paths: [{ nodes: [node(klass.class, "Class"), node(klass.subject, "Subject")], relationships: [fwd("FOR_SUBJECT")] }],
      };
    }
    if (asks(/teach|instruct|who/)) {
      return {
        retrieved: [{ teacher: klass.teacher }],
        answer: `${klass.teacher} teaches ${klass.class}.`,
        cypher: `MATCH (t:Teacher)-[:TEACHES]->(c:Class {name: "${klass.class}"})\nRETURN t.name AS teacher`,
        paths: [{ nodes: [node(klass.teacher, "Teacher"), node(klass.class, "Class")], relationships: [fwd("TEACHES")] }],
      };
    }
  }

  if (dept) {
    if (asks(/head|chair|lead/)) {
      const head = teachers.find((t) => t.department === dept && t.head)!;
      return {
        retrieved: [{ department_head: head.name }],
        answer: `${head.name} heads the ${dept} department.`,
        cypher: `MATCH (h:Teacher)-[:HEADS]->(d:Department {name: "${dept}"})\nRETURN h.name AS department_head`,
        paths: [{ nodes: [node(head.name, "Teacher"), node(dept, "Department")], relationships: [fwd("HEADS")] }],
      };
    }
    const members = teachers.filter((t) => t.department === dept).map((t) => t.name);
    return {
      retrieved: members.map((name) => ({ teacher: name })),
      answer: `${listJoin(members)} ${members.length > 1 ? "belong" : "belongs"} to the ${dept} department.`,
      cypher: `MATCH (t:Teacher)-[:BELONGS_TO]->(d:Department {name: "${dept}"})\nRETURN t.name AS teacher`,
      paths: members.map((m) => ({ nodes: [node(m, "Teacher"), node(dept, "Department")], relationships: [fwd("BELONGS_TO")] })),
    };
  }

  return null;
}

/* ---------------- VECTOR ---------------- */

/**
 * Answers in the style of the precision-tuned VECTOR prompt: answer only what was asked,
 * with conditions/exceptions only when they affect the answer. Wording follows
 * evaluation/generation_eval_precision_final.csv where the same question was evaluated.
 * The first entry whose `match` fits the question wins; the entry without `match` is the fallback.
 */
const VECTOR_ANSWERS: Record<string, { match?: RegExp; answer: string }[]> = {
  "Late Assignment Policy": [
    {
      match: /(three|four|five|3|4|5)\s+(school\s+)?days?/,
      answer:
        "Yes. You may submit the assignment up to five school days late, but a 10 percent deduction will be applied after the second day. Teachers can approve extensions for documented circumstances.",
    },
    {
      match: /(one|two|1|2)\s+(school\s+)?days?/,
      answer: "Yes. Assignments submitted one or two days late receive no penalty.",
    },
    {
      match: /sick|\bill|extension|more time/,
      answer: "Yes. Teachers may approve extensions for illness or other documented circumstances.",
    },
    {
      answer:
        "Assignments may be submitted up to five school days late. There is no penalty for one or two days late; after the second day, a 10 percent deduction is applied.",
    },
  ],
  "Attendance Policy": [
    {
      match: /report|9|when should|call/,
      answer: "Parents or guardians must report an absence before 9 AM.",
    },
    {
      answer:
        "If a student has more than five unexcused absences in a semester, they must meet with their counselor and their parent or guardian.",
    },
  ],
  "Grading Policy": [
    { match: /\ban a\b|grade a\b/, answer: "An A represents scores from 90 to 100 percent." },
    { match: /\ba b\b|grade b\b|8\d/, answer: "A B represents scores from 80 to 89 percent." },
    { match: /\ba c\b|grade c\b|7\d/, answer: "A C represents scores from 70 to 79 percent." },
    { match: /below 70|support|fail/, answer: "Students scoring below 70 percent may be offered additional academic support." },
    {
      answer:
        "The school uses a standard letter grading system: an A is 90–100 percent, a B is 80–89 percent and a C is 70–79 percent.",
    },
  ],
  "Science Lab Incident": [
    { match: /why|cause|reason/, answer: "Physics 101 was moved because a water leak affected Science Lab 3." },
    { match: /where|moved|go\b|went/, answer: "Physics 101 was temporarily moved to Science Lab 5." },
    { match: /injur|hurt/, answer: "No. No students or teachers were injured." },
    { match: /return|back/, answer: "Physics 101 returned to Science Lab 3 the day after the leak." },
    {
      answer:
        "On September 12, a water leak affected Science Lab 3, so Physics 101 moved to Science Lab 5. The leak was repaired that afternoon and the class returned the next day.",
    },
  ],
  "Field Trip Policy": [
    {
      match: /how early|when|how many days|deadline/,
      answer: "A field trip permission form must be submitted at least three school days before the trip.",
    },
    {
      answer:
        "Yes. Students must submit a signed parent or guardian permission form at least three school days before the trip. Without a completed form, a student cannot participate.",
    },
  ],
  "Technology Policy": [
    {
      match: /install|game|gaming|software/,
      answer: "No. Personal gaming and unauthorized software installation are prohibited on school laptops.",
    },
    {
      match: /damage|lost|broken|break/,
      answer: "The student should report the lost or damaged device to the technology office.",
    },
    { answer: "Students may use school laptops for academic purposes." },
  ],
};

function vectorRetrieve(question: string): { retrieved: VectorRecord[]; answer: string } {
  const ranked = scoreDocuments(question);
  if (ranked[0].hits === 0) return { retrieved: [], answer: NO_INFO_ANSWER };

  const top3 = ranked.slice(0, 3);
  const retrieved = top3.map(({ doc, hits }, i) => ({
    title: doc.title,
    category: doc.category,
    text: doc.text,
    score: i === 0 ? Math.min(0.58 + hits * 0.06, 0.84) : +(0.34 - i * 0.05 + hits * 0.03).toFixed(2),
  }));

  const q = lower(question);
  const answers = VECTOR_ANSWERS[top3[0].doc.title];
  const answer = (answers.find((a) => !a.match || a.match.test(q)) ?? answers[answers.length - 1]).answer;
  return { retrieved, answer };
}

/* ---------------- EXACT ---------------- */

function exactRetrieve(question: string): { retrieved: ExactRecord[]; answer: string; extractedName: string } {
  const people = [
    ...teachers.map((t) => ({ name: t.name, type: ["Teacher"] })),
    ...students.map((s) => ({ name: s.name, type: ["Student"] })),
  ];
  const extractedName =
    question
      .replace(LOOKUP_INTENT, "")
      .replace(/[?.!]/g, "")
      .trim() || question;
  const tokens = lower(extractedName).split(/\s+/).filter(Boolean);

  // Approximates Lucene full-text scoring: each matching name token contributes.
  const retrieved = people
    .map((p) => {
      const nameTokens = lower(p.name).split(" ");
      const matched = tokens.filter((t) => nameTokens.includes(t)).length;
      return { ...p, score: +(matched * 0.6931).toFixed(4) };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!retrieved.length) return { retrieved, answer: NO_INFO_ANSWER, extractedName };

  const best = retrieved[0];
  const kind = (r: ExactRecord) => r.type[0].toLowerCase();
  const fullMatch = best.score > retrieved[1]?.score || retrieved.length === 1;
  const answer = fullMatch
    ? `${best.name} is a ${kind(best)}.`
    : `${retrieved.length} people match “${extractedName}”: ${listJoin(retrieved.map((r) => `${r.name} (${kind(r)})`))}.`;
  return { retrieved, answer, extractedName };
}

/* ---------------- entry point ---------------- */

export async function mockAsk(question: string): Promise<AskResponse> {
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 500));

  const route = mockRoute(question);

  if (route === "GRAPH") {
    const result = graphRetrieve(question);
    if (!result || !result.retrieved.length) {
      return { question, route, answer: NO_INFO_ANSWER, retrieved: [], trace: { method: "Text-to-Cypher" } };
    }
    return {
      question,
      route,
      answer: result.answer,
      retrieved: result.retrieved,
      trace: { method: "Text-to-Cypher", cypher: result.cypher, paths: result.paths },
    };
  }

  if (route === "EXACT") {
    const { retrieved, answer, extractedName } = exactRetrieve(question);
    return {
      question,
      route,
      answer,
      retrieved,
      trace: { method: "Full-text entity search", index: "school_names", extractedName },
    };
  }

  const { retrieved, answer } = vectorRetrieve(question);
  return {
    question,
    route,
    answer,
    retrieved,
    trace: {
      method: "Vector similarity search",
      index: "school_chunks",
      embeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
    },
  };
}
