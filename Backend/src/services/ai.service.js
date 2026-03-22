const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer-core")
const chromium = require("chrome-aws-lambda") // ✅ ADD THIS

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum([ "low", "medium", "high" ])
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string())
    })),
    title: z.string(),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    try {
        const prompt = `Generate an interview report for a candidate with the following details:
        Resume: ${resume}
        Self Description: ${selfDescription}
        Job Description: ${jobDescription}`

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            }
        })

        return JSON.parse(response.text)

    } catch (err) {
        console.error("❌ Interview Report Error:", err.message)
        throw err
    }
}


async function generatePdfFromHtml(htmlContent) {

    try {
        console.log("🚀 Starting Puppeteer...")

        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath, // ✅ IMPORTANT
            headless: chromium.headless,
        })

        const page = await browser.newPage()

        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4",
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        await browser.close()

        console.log("✅ PDF Generated Successfully")

        return pdfBuffer

    } catch (err) {
        console.error("❌ PDF Generation Error:", err.message) // 🔥 DEBUG
        throw err
    }
}


async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    try {
        const resumePdfSchema = z.object({
            html: z.string()
        })

        const prompt = `Generate resume for a candidate with the following details:
        Resume: ${resume}
        Self Description: ${selfDescription}
        Job Description: ${jobDescription}`

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
            }
        })

        const jsonContent = JSON.parse(response.text)

        if (!jsonContent.html) {
            throw new Error("HTML not generated from AI") // 🔥 DEBUG
        }

        const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

        return pdfBuffer

    } catch (err) {
        console.error("❌ Resume PDF Error:", err.message) // 🔥 DEBUG
        throw err
    }
}

module.exports = { generateInterviewReport, generateResumePdf }
