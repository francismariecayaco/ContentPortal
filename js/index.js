// functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.createUserAsAdmin = functions.https.onCall(async (data, context) => {
  // Only allow superadmin/admin roles to call this function
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Request had no auth.');
  }
  // You can add more role checks here by reading Firestore user profile
  const { email, password, role, profile, companyName } = data;
  if (!email || !password || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }
  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: email,
    });
    // Add user profile to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: email,
      role,
      tempPassword: password,
      companyName: companyName || null,
      profile: profile || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});