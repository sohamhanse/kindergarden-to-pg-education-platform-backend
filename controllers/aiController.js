const Course = require('../models/Course');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const aiController = {
    // Generate blog content based on topic and parameters
    generateBlog: async (req, res, next) => {
        try {
            const { topic, length, tone, targetAudience } = req.body;

            if (!topic) {
                throw new ApiError('Topic is required', 400);
            }

            const prompt = `Write a ${length || 'medium'} length blog post about ${topic}. 
                          Tone should be ${tone || 'professional'} and target audience is ${targetAudience || 'general'}.`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { 
                        role: "system", 
                        content: "You are a professional blog writer with expertise in educational content." 
                    },
                    { 
                        role: "user", 
                        content: prompt 
                    }
                ],
                max_tokens: 1500
            });

            res.json({
                content: completion.choices[0].message.content,
                metadata: {
                    topic,
                    length,
                    tone,
                    targetAudience
                }
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Translate audio content to text in specified language
    translateAudio: async (req, res, next) => {
        try {
            const { audioUrl, targetLanguage } = req.body;

            if (!audioUrl) {
                throw new ApiError('Audio URL is required', 400);
            }

            // First, transcribe the audio
            const transcription = await openai.audio.transcriptions.create({
                file: await fetch(audioUrl).then(res => res.blob()),
                model: "whisper-1"
            });

            // Then translate if target language is different from transcription
            if (targetLanguage && targetLanguage !== 'en') {
                const translation = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: `You are a professional translator. Translate the following text to ${targetLanguage}`
                        },
                        {
                            role: "user",
                            content: transcription.text
                        }
                    ]
                });

                res.json({
                    originalText: transcription.text,
                    translatedText: translation.choices[0].message.content,
                    targetLanguage
                });
            } else {
                res.json({
                    text: transcription.text,
                    language: 'en'
                });
            }
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    },

    // Generate academic progress report
    generateReport: async (req, res, next) => {
        try {
            const { studentId, courseId, timeframe } = req.body;

            // Verify authorization
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                throw new ApiError('Unauthorized to generate reports', 403);
            }

            // Get student data
            const student = await User.findById(studentId)
                .populate({
                    path: 'coursesEnrolled',
                    match: { _id: courseId },
                    populate: [
                        { path: 'content.assignments' },
                        { path: 'content.quizzes' }
                    ]
                });

            if (!student) {
                throw new ApiError('Student not found', 404);
            }

            // Compile student performance data
            const courseData = student.coursesEnrolled[0];
            const performanceData = {
                assignments: courseData.content.assignments.map(a => ({
                    title: a.title,
                    score: a.submissions.find(s => s.student.toString() === studentId)?.grade || 'Not submitted'
                })),
                quizzes: courseData.content.quizzes.map(q => ({
                    title: q.title,
                    score: q.attempts.find(a => a.student.toString() === studentId)?.score || 'Not attempted'
                }))
            };

            // Generate AI analysis
            const analysis = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an educational analytics expert. Generate a comprehensive student progress report."
                    },
                    {
                        role: "user",
                        content: JSON.stringify(performanceData)
                    }
                ]
            });

            res.json({
                studentName: student.personalInfo.name,
                courseName: courseData.title,
                timeframe,
                performanceData,
                aiAnalysis: analysis.choices[0].message.content
            });
        } catch (error) {
            next(new ApiError(error.message, error.status || 400));
        }
    }
};

module.exports = aiController;
