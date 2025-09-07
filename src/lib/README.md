# Mock Data

For the purpose of this demonstration application, all data is stored in-memory using mock data arrays. This file explains the structure and location of this data.

## Data Source

The primary source for all mock data is `src/lib/data.ts`. This file exports several arrays that simulate a database:

-   `users`: An array of user objects, including students, teachers, and admins.
-   `classes`: An array defining the classes, including which teachers are assigned and which students are enrolled.
-   `attendanceRecords`: An array that logs attendance for different classes on different dates.

## Facial "Embeddings"

Instead of storing complex numerical embeddings (like vector arrays), this application simplifies the process by storing the captured face image itself.

-   The `faceprint` property on each `User` object in `src/lib/data.ts` holds a **Base64-encoded data URI** of the user's reference image.
-   During verification, the live camera image is also converted to a data URI.
-   The Genkit AI flows then receive both the stored image URI and the live image URI and perform a direct visual comparison to determine if they are a match.

This approach simulates the functionality of a facial recognition system within the constraints of a web-based environment without a persistent database or local file system for storing vector embeddings. In a production system, you would replace the logic in `src/lib/data.ts` with calls to a real database.