
'use server';

/**
 * @fileOverview Registers a new user (student or teacher) in the system using Firestore.
 *
 * - registerUser - A function that handles the user registration process.
 * - RegisterUserInput - The input type for the registerUser function.
 * - RegisterUserOutput - The return type for the registerUser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import type { User } from '@/lib/data';


const RegisterUserInputSchema = z.object({
  name: z.string().describe('The full name of the user.'),
  role: z.enum(['Student', 'Teacher']).describe('The role of the user.'),
  faceprint: z
    .string()
    .describe(
      "A photo of the user's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>;

const RegisterUserOutputSchema = z.object({
  id: z.string().describe('The newly created user ID.'),
  name: z.string().describe('The name of the user.'),
  role: z.enum(['Student', 'Teacher']).describe('The role of the user.'),
  username: z.string().describe('The generated username for the user.'),
  password: z.string().describe('The generated password for the user.'),
});
export type RegisterUserOutput = z.infer<typeof RegisterUserOutputSchema>;

export async function registerUser(input: RegisterUserInput): Promise<RegisterUserOutput> {
  return registerUserFlow(input);
}

const generatePassword = () => {
    // A simple, deterministic password for demo purposes.
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

const registerUserFlow = ai.defineFlow(
  {
    name: 'registerUserFlow',
    inputSchema: RegisterUserInputSchema,
    outputSchema: RegisterUserOutputSchema,
  },
  async (input) => {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

    // Check for duplicate faces before registering, only if users exist
    if (users.length > 0) {
        for (const user of users) {
            // Ensure the user has a valid faceprint before comparing
            if(user.faceprint && user.faceprint.startsWith('data:image')) {
                const { output } = await ai.generate({
                    model: 'googleai/gemini-2.5-flash',
                    prompt: `You are a facial recognition expert. Compare the two images. Determine if they show the same person.
New User Photo: {{media url=newUserPhoto}}
Existing User Photo: {{media url=existingUserPhoto}}`,
                    input: {
                        newUserPhoto: input.faceprint,
                        existingUserPhoto: user.faceprint,
                    },
                    output: {
                        schema: z.object({
                            isMatch: z.boolean().describe('Whether the two faces are a definite match.'),
                            confidence: z.number().min(0).max(1).describe('The confidence of the match, from 0.0 to 1.0.'),
                        })
                    }
                });

                // Use a high threshold for duplicate check to avoid false positives
                if (output && output.isMatch && output.confidence > 0.95) {
                    throw new Error(`This person appears to be already registered as ${user.name} (ID: ${user.id}).`);
                }
            }
        }
    }
    
    // Determine user ID
    const rolePrefix = input.role === 'Student' ? 'student' : 'teacher';
    const existingCount = users.filter(u => u.role === input.role).length;
    const newId = `${rolePrefix}${(existingCount + 1).toString().padStart(2, '0')}`;
    
    // Generate credentials
    const username = `${input.name.toLowerCase().split(' ')[0]}_${rolePrefix}`;
    const password = generatePassword();

    // Create user object
    const newUser: Omit<User, 'id'> = {
      name: input.name,
      role: input.role,
      faceprint: input.faceprint,
      username,
      password,
    };

    // Save to Firestore
    const userRef = doc(db, "users", newId);
    await setDoc(userRef, newUser);
    console.log(`Firestore: User ${newUser.name} with ID ${newId} has been saved.`);
    
    return {
      id: newId,
      name: newUser.name,
      role: newUser.role,
      username: newUser.username,
      password: newUser.password!,
    };
  }
);
