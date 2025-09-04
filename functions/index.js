const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Cloud Function to create a new user in Firebase Auth and Firestore
exports.createUserByAdmin = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Fetch caller's role from Firestore
  const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User profile not found');
  }
  const callerData = callerDoc.data();
  const allowedRoles = ['staff', 'admin-manager', 'admin-president', 'superadmin'];
  if (!allowedRoles.includes(callerData.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create users');
  }

  const { email, password, role, companyId, profile } = data;
  if (!email || !password || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: email,
      disabled: false
    });
    // Write profile to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: email,
      role,
      companyId: companyId || null,
      profile: profile || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
