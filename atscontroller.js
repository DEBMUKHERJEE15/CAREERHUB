import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const analyzeATS = async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription;
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.json({ error: "Resume file is required." });
    }

    if (!jobDescription || jobDescription.length < 30) {
      return res.json({ error: "Job description must be longer." });
    }

    let resumeText = "";

    if (resumeFile.mimetype === "application/pdf") {
      const pdfData = await pdfParse(fs.readFileSync(resumeFile.path));
      resumeText = pdfData.text;
    } else if (
      resumeFile.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const docxData = await mammoth.extractRawText({
        path: resumeFile.path,
      });
      resumeText = docxData.value;
    } else {
      return res.json({ error: "Only PDF or DOCX files allowed." });
    }

    // PROCESSING LOGIC: Keyword-based score
    const jdWords = jobDescription.toLowerCase().split(/\W+/);
    const resumeWords = resumeText.toLowerCase().split(/\W+/);

    let matchCount = 0;
    jdWords.forEach((word) => {
      if (resumeWords.includes(word)) matchCount++;
    });

    const score = Math.round((matchCount / jdWords.length) * 100);

    res.json({
      atsScore: Math.min(score, 98),
      matchedKeywords: matchCount,
      totalKeywords: jdWords.length,
      analysis: score < 40
        ? "Poor match. Add more job-specific keywords."
        : score < 70
        ? "Moderate match. Improve keyword usage and formatting."
        : "Great match! Resume is well optimized.",
    });
  } catch (error) {
    res.json({ error: "Error processing resume." });
  }
};
