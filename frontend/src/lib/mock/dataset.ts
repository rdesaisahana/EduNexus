/**
 * Synthetic school data, copied verbatim from graphrag.ipynb.
 * Used only by the mock service when no backend URL is configured.
 */

export const teachers = [
  { name: "Daniel Smith", department: "Science", head: false },
  { name: "Rachel Wilson", department: "Science", head: true },
  { name: "Laura Taylor", department: "Mathematics", head: true },
  { name: "James Miller", department: "English", head: true },
  { name: "Priya Patel", department: "Social Studies", head: true },
  { name: "Michael Brown", department: "Mathematics", head: false },
];

export const classes = [
  { class: "Physics 101", subject: "Physics", teacher: "Daniel Smith" },
  { class: "Biology 101", subject: "Biology", teacher: "Rachel Wilson" },
  { class: "Algebra 2", subject: "Mathematics", teacher: "Laura Taylor" },
  { class: "Geometry", subject: "Mathematics", teacher: "Michael Brown" },
  { class: "English Literature", subject: "English", teacher: "James Miller" },
  { class: "US History", subject: "History", teacher: "Priya Patel" },
];

export const students = [
  { name: "Emma Johnson", classes: ["Physics 101", "Algebra 2"] },
  { name: "Noah Williams", classes: ["Physics 101", "English Literature"] },
  { name: "Sophia Davis", classes: ["Biology 101", "Algebra 2"] },
  { name: "Liam Anderson", classes: ["Physics 101", "US History"] },
  { name: "Olivia Martin", classes: ["Biology 101", "Geometry"] },
  { name: "Ethan Thompson", classes: ["Physics 101", "Geometry"] },
  { name: "Ava Garcia", classes: ["Biology 101", "English Literature"] },
  { name: "Lucas Martinez", classes: ["Algebra 2", "US History"] },
  { name: "Mia Robinson", classes: ["Physics 101", "English Literature"] },
  { name: "Benjamin Clark", classes: ["Biology 101", "Geometry"] },
  { name: "Charlotte Lewis", classes: ["Algebra 2", "English Literature"] },
  { name: "Henry Walker", classes: ["Physics 101", "US History"] },
  { name: "Amelia Hall", classes: ["Biology 101", "Algebra 2"] },
  { name: "Alexander Young", classes: ["Geometry", "US History"] },
  { name: "Harper King", classes: ["Physics 101", "English Literature"] },
  { name: "Daniel Wright", classes: ["Biology 101", "Geometry"] },
  { name: "Evelyn Scott", classes: ["Algebra 2", "US History"] },
  { name: "Matthew Green", classes: ["Physics 101", "Geometry"] },
  { name: "Abigail Baker", classes: ["Biology 101", "English Literature"] },
  { name: "Jackson Adams", classes: ["Algebra 2", "US History"] },
];

export const departments = ["Science", "Mathematics", "English", "Social Studies"];

export interface SchoolDocument {
  title: string;
  category: "Policy" | "Incident";
  text: string;
  /** Mock-only: keywords used to approximate semantic similarity. */
  keywords: string[];
}

export const documents: SchoolDocument[] = [
  {
    title: "Late Assignment Policy",
    category: "Policy",
    text:
      "Students may submit assignments up to five school days late. Assignments submitted one or two days late receive no penalty. After the second day, a 10 percent deduction is applied. Teachers may approve extensions for illness or other documented circumstances.",
    keywords: ["late", "homework", "assignment", "submit", "deadline", "extension", "penalty", "deduction", "overdue"],
  },
  {
    title: "Attendance Policy",
    category: "Policy",
    text:
      "Students are expected to attend all scheduled classes. Parents or guardians must report an absence before 9 AM. Students with more than five unexcused absences in a semester must meet with their counselor and parent or guardian.",
    keywords: ["absence", "absences", "absent", "attendance", "unexcused", "counselor", "miss", "report", "9 am", "sick"],
  },
  {
    title: "Grading Policy",
    category: "Policy",
    text:
      "Greenwood Academy uses a standard letter grading system. An A represents scores from 90 to 100 percent. A B represents scores from 80 to 89 percent. A C represents scores from 70 to 79 percent. Students scoring below 70 percent may be offered additional academic support.",
    keywords: ["grade", "grading", "letter", "score", "percent", "academic support", "a grade", "below 70"],
  },
  {
    title: "Science Lab Incident",
    category: "Incident",
    text:
      "On September 12, a water leak affected Science Lab 3. Physics 101 was temporarily moved to Science Lab 5. No students or teachers were injured. Maintenance repaired the leak that afternoon. Physics 101 returned to Science Lab 3 the following day.",
    keywords: ["leak", "water", "lab", "moved", "incident", "injured", "maintenance", "relocated", "happened", "problem", "classroom", "lab 3", "lab 5"],
  },
  {
    title: "Field Trip Policy",
    category: "Policy",
    text:
      "Students participating in school field trips must submit a signed parent or guardian permission form. Permission forms must be submitted at least three school days before the trip. Students without a completed permission form cannot participate.",
    keywords: ["field trip", "trip", "permission", "form", "signed", "excursion"],
  },
  {
    title: "Technology Policy",
    category: "Policy",
    text:
      "Students may use school laptops for academic purposes. Personal gaming and unauthorized software installation are prohibited. Students must report lost or damaged devices to the technology office.",
    keywords: ["laptop", "technology", "device", "software", "gaming", "lost", "damaged", "computer", "install"],
  },
];
