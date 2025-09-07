
'use server';

/**
 * @fileOverview Verifies the teacher's face after student verification for attendance approval using Firestore data.
 *
 * - verifyTeacherFace - A function that handles the teacher face verification process.
 * - VerifyTeacherFaceInput - The input type for the verifyTeacherFace function.
 * - VerifyTeacherFaceOutput - The return type for the verifyTeacherFace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from "@/lib/firebase";
import { doc, getDoc } from 'firebase/firestore';
import type { User, Class } from '@/lib/data';


const VerifyTeacherFaceInputSchema = z.object({
  teacherPhotoDataUri: z
    .string()
    .describe(
      "A photo of the teacher's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  classId: z.string().describe('The ID of the class for which attendance is being taken.'),
});
export type VerifyTeacherFaceInput = z.infer<typeof VerifyTeacherFaceInputSchema>;

const VerifyTeacherFaceOutputSchema = z.object({
  isTeacherVerified: z.boolean().describe('Whether the teacher was successfully verified.'),
  message: z.string().describe('A message indicating the verification result.'),
  teacherId: z.string().optional().describe('The ID of the verified teacher.'),
});
export type VerifyTeacherFaceOutput = z.infer<typeof VerifyTeacherFaceOutputSchema>;

export async function verifyTeacherFace(input: VerifyTeacherFaceInput): Promise<VerifyTeacherFaceOutput> {
  return verifyTeacherFaceFlow(input);
}

const verifyTeacherIdentityPrompt = ai.definePrompt({
    name: 'verifyTeacherIdentityPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: z.object({
        teacherPhotoDataUri: z.string(),
        storedFaceDataUri: z.string(),
    })},
    output: { schema: z.object({
        isMatch: z.boolean().describe('Whether the two faces are a definite match.'),
        confidence: z.number().describe('The confidence of the match, from 0.0 to 1.0.'),
    }) },
    prompt: `You are a facial recognition expert. Compare the live photo with the stored reference photo and determine if they are the same person.
    
Imagine the live feed is actually a short video composed of multiple frames. You must determine if the person in the live feed is a definite match to the stored faceprint. The match must be of high confidence.

Output in JSON format.

Live Photo: {{media url=teacherPhotoDataUri}}
Reference Photo: {{media url=storedFaceDataUri}}`
});

const verifyTeacherFaceFlow = ai.defineFlow(
  {
    name: 'verifyTeacherFaceFlow',
    inputSchema: VerifyTeacherFaceInputSchema,
    outputSchema: VerifyTeacherFaceOutputSchema,
  },
  async (input) => {
    const classRef = doc(db, "classes", input.classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
        return { isTeacherVerified: false, message: 'Class not found.' };
    }
    const classInfo = classDoc.data() as Class;

    // Iterate through assigned teachers and check their faceprints
    for (const teacherId of classInfo.teacherIds) {
        const teacherRef = doc(db, "users", teacherId);
        const teacherDoc = await getDoc(teacherRef);
        
        if (teacherDoc.exists()) {
            const teacher = teacherDoc.data() as User;
            // Ensure teacher has a valid faceprint before trying to verify
            if (teacher.role === 'Teacher' && teacher.faceprint && teacher.faceprint.startsWith('data:image')) {
                const { output } = await verifyTeacherIdentityPrompt({
                    teacherPhotoDataUri: input.teacherPhotoDataUri,
                    storedFaceDataUri: teacher.faceprint,
                });

                if (output && output.isMatch && output.confidence > 0.75) {
                    return { isTeacherVerified: true, message: `Verified as ${teacher.name}.`, teacherId: teacherId };
                }
            }
        }
    }

    return { isTeacherVerified: false, message: 'Teacher not recognized or not authorized for this class.' };
  }
);
