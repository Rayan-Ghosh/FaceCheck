
'use server';

/**
 * @fileOverview Verifies student identity using facial recognition against Firestore data.
 *
 * - verifyStudentFace - A function that handles the student face verification process.
 * - VerifyStudentFaceInput - The input type for the verifyStudentFace function.
 * - VerifyStudentFaceOutput - The return type for the verifyStudentFace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/data';

const VerifyStudentFaceInputSchema = z.object({
  studentId: z.string().describe("The student's ID."),
  studentFaceDataUri: z
    .string()
    .describe(
      "A photo of the student's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VerifyStudentFaceInput = z.infer<typeof VerifyStudentFaceInputSchema>;

const VerifyStudentFaceOutputSchema = z.object({
  isMatch: z.boolean().describe('Whether the provided face matches the stored face.'),
  confidence: z.number().describe('The confidence level of the face match (0-1).'),
});
export type VerifyStudentFaceOutput = z.infer<typeof VerifyStudentFaceOutputSchema>;

export async function verifyStudentFace(input: VerifyStudentFaceInput): Promise<VerifyStudentFaceOutput> {
  return verifyStudentFaceFlow(input);
}

const verifyStudentFacePrompt = ai.definePrompt({
  name: 'verifyStudentFacePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: z.object({
      studentFaceDataUri: z.string(),
      storedFaceDataUri: z.string(),
  })},
  output: {schema: VerifyStudentFaceOutputSchema},
  prompt: `You are an expert in facial recognition. You will be provided two face images, one of which is a live camera feed, and the other of which is a stored faceprint.
  
Imagine the live feed is actually a short video composed of multiple frames. You must determine if the person in the live feed is a definite match to the stored faceprint. The match must be of high confidence.

Output in JSON format whether the faces are a match (isMatch: true or false), and the confidence level of the match (confidence: 0-1).

Live Camera Feed: {{media url=studentFaceDataUri}}
Stored Faceprint: {{media url=storedFaceDataUri}}`,
});

const verifyStudentFaceFlow = ai.defineFlow(
  {
    name: 'verifyStudentFaceFlow',
    inputSchema: VerifyStudentFaceInputSchema,
    outputSchema: VerifyStudentFaceOutputSchema,
  },
  async (input) => {
    const studentRef = doc(db, "users", input.studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists() || studentDoc.data().role !== 'Student') {
      throw new Error('Student not found.');
    }
    const student = studentDoc.data() as User;

    if (!student.faceprint || !student.faceprint.startsWith('data:image')) {
        throw new Error('Stored faceprint for this student is missing or invalid.');
    }
    
    const {output} = await verifyStudentFacePrompt({
        studentFaceDataUri: input.studentFaceDataUri,
        storedFaceDataUri: student.faceprint,
    });

    if (!output) {
        throw new Error('Face verification failed to produce a result.');
    }

    return output;
  }
);
