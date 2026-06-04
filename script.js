const resumeForm = document.getElementById('resumeForm');
const resumeText = document.getElementById('resumeText');
const resumeFile = document.getElementById('resumeFile');
const heroCandidateName = document.getElementById('heroCandidateName');
const candidateName = document.getElementById('candidateName');
const candidateEmail = document.getElementById('candidateEmail');
const candidatePhone = document.getElementById('candidatePhone');
const candidateEducation = document.getElementById('candidateEducation');
const candidateSkills = document.getElementById('candidateSkills');
const candidateExperience = document.getElementById('candidateExperience');
const candidateKeywords = document.getElementById('candidateKeywords');
const candidateSummary = document.getElementById('candidateSummary');
const candidateAts = document.getElementById('candidateAts');
const confidenceBadge = document.getElementById('confidenceBadge');

const skillCatalog = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'FastAPI',
  'Express',
  'HTML',
  'CSS',
  'SQL',
  'MongoDB',
  'AWS',
  'Docker',
  'Git',
  'Figma'
];

const educationKeywords = [
  'bachelor',
  'master',
  'mba',
  'mca',
  'b.tech',
  'btech',
  'bsc',
  'msc',
  'phd',
  'diploma',
  'university',
  'college'
];

const sampleResume = `Priya Sharma
priya.sharma@email.com | +91 98765 43210 | Bengaluru

Professional Summary
Software engineer with 5 years of experience building web applications and internal tools.

Skills
JavaScript, React, Node.js, Python, SQL, Docker, Git

Education
MCA, Bangalore University

Experience
Led front-end development for a recruitment dashboard and automated candidate workflows.`;

resumeText.value = sampleResume;
renderResult(parseResume(sampleResume));

resumeFile.addEventListener('change', async () => {
  const file = resumeFile.files?.[0];
  if (!file) return;

  const text = await readResumeFile(file);
  if (!text) {
    resumeText.value = '';
    renderResult({
      name: 'Unable to parse file',
      email: 'Not detected',
      phone: 'Not detected',
      education: 'Not detected',
      skills: 'Not detected',
      experience: 'Not detected',
      keywords: 'Not detected',
      summary: 'This file type could not be read as text. Upload a .txt, .md, .json, or .docx resume for parsing.',
      confidence: 0,
      atsScore: 0
    });
    return;
  }

  resumeText.value = text;
  renderResult(parseResume(text));
});

resumeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderResult(parseResume(resumeText.value));
});

function readResumeFile(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return readDocxFile(file);
  }

  if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'application/json' || /\.(txt|md|json)$/.test(fileName)) {
    return file.text().catch(() => '');
  }

  return Promise.resolve('');
}

async function readDocxFile(file) {
  if (typeof mammoth === 'undefined') {
    return '';
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch {
    return '';
  }
}

function parseResume(text) {
  const cleanedText = text.trim();
  const lines = cleanedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const emailMatch = cleanedText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/i);
  const phoneMatch =
    cleanedText.match(/(?:\+\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}/) ||
    cleanedText.match(/(?:\+\d{1,3}[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{4}/);
  const name = extractName(lines);
  const skills = skillCatalog.filter((skill) => new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i').test(cleanedText));
  const education = extractEducation(cleanedText);
  const experience = extractExperience(cleanedText);
  const keywords = extractKeywords(cleanedText);
  const summary = buildSummary(name, skills, education, cleanedText);
  const confidence = calculateConfidence({ name, emailMatch, phoneMatch, skills, education, experience, cleanedText });
  const atsScore = calculateAtsScore({ confidence, skills, education, experience, keywords });

  return {
    name: name || 'Candidate profile',
    email: emailMatch?.[0] || 'Not detected',
    phone: phoneMatch?.[0].replace(/\s+/g, ' ').trim() || 'Not detected',
    education: education || 'Not detected',
    skills: skills.length ? skills.join(', ') : 'Not detected',
    experience: experience || 'Not detected',
    keywords: keywords.length ? keywords.join(', ') : 'Not detected',
    summary,
    confidence,
    atsScore
  };
}

function extractName(lines) {
  if (!lines.length) return '';

  const firstLine = lines[0];
  if (firstLine.includes('@') || /\d/.test(firstLine)) {
    return lines[1] || '';
  }

  return firstLine.replace(/[^a-zA-Z\s'.-]/g, '').trim();
}

function extractEducation(text) {
  const educationLine = text
    .split(/\r?\n/)
    .find((line) => educationKeywords.some((keyword) => line.toLowerCase().includes(keyword)));

  return educationLine ? educationLine.trim() : '';
}

function extractExperience(text) {
  const yearMatch = text.match(/(\d+)\+?\s+years?/i);
  if (yearMatch) {
    return `${yearMatch[1]} years experience`;
  }

  const titleMatch = text.match(/(software engineer|web developer|frontend developer|backend developer|full stack developer|data analyst|product manager|designer)/i);
  return titleMatch ? titleMatch[0] : '';
}

function extractKeywords(text) {
  const keywordPool = ['team', 'project', 'leadership', 'agile', 'automation', 'analysis', 'communication', 'development', 'optimization'];
  return keywordPool.filter((keyword) => new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(text)).slice(0, 5);
}

function buildSummary(name, skills, education, text) {
  const experienceMatch = text.match(/(\d+)\s+years?/i);
  const experience = experienceMatch ? `${experienceMatch[1]} years of experience` : 'relevant experience';
  const skillSentence = skills.length ? `Core skills include ${skills.slice(0, 4).join(', ')}.` : 'Skills were not clearly detected.';
  const educationSentence = education ? `Education signal detected from "${education}".` : 'No education line was detected.';

  return `${name || 'This candidate'} shows ${experience}. ${skillSentence} ${educationSentence}`;
}

function calculateConfidence({ name, emailMatch, phoneMatch, skills, education, experience, cleanedText }) {
  let score = 18;
  if (name) score += 16;
  if (emailMatch) score += 18;
  if (phoneMatch) score += 15;
  if (skills.length >= 2) score += 16;
  if (education) score += 10;
  if (experience) score += 9;
  if (cleanedText.length > 120) score += 7;
  return Math.min(score, 98);
}

function calculateAtsScore({ confidence, skills, education, experience, keywords }) {
  let score = Math.round(confidence * 0.6);
  if (skills.length >= 4) score += 12;
  if (education !== 'Not detected') score += 8;
  if (experience !== 'Not detected') score += 10;
  if (keywords.length >= 2) score += 8;
  return Math.min(score, 100);
}

function renderResult(result) {
  heroCandidateName.textContent = result.name;
  candidateName.textContent = result.name;
  candidateEmail.textContent = result.email;
  candidatePhone.textContent = result.phone;
  candidateEducation.textContent = result.education;
  candidateSkills.textContent = result.skills;
  candidateExperience.textContent = result.experience;
  candidateKeywords.textContent = result.keywords;
  candidateSummary.textContent = result.summary;
  candidateAts.textContent = `ATS score: ${result.atsScore}% | Confidence: ${result.confidence}% | Best match: ${result.skills === 'Not detected' ? 'Needs more detail' : 'Strong'}`;
  confidenceBadge.textContent = `${result.confidence}% confidence`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
