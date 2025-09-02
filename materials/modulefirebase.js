/*
      Firestore Security Rules (copy to Firebase Console -> Firestore -> Rules)

      // Basic rules (example) - require adjustments for production
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          function isSignedIn() { return request.auth != null; }
          function isSuperAdmin(){ return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin'; }
          function isCompanyAdmin(companyId){ return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin-manager','admin-president','superadmin']); }

          // users: users can read/write their own profile; admins can read company users
          match /users/{userId} {
            allow read: if isSignedIn() && (request.auth.uid == userId || isSuperAdmin() || resource.data.companyId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId);
            allow create: if isSignedIn();
            allow update: if isSignedIn() && (request.auth.uid == userId || isSuperAdmin() || isCompanyAdmin(resource.data.companyId));
            allow delete: if isSuperAdmin();
          }

          // companies: read mostly public; create by superadmin; update by superadmin or company admin
          match /companies/{co} {
            allow read: if true;
            allow create: if isSuperAdmin();
            allow update, delete: if isSuperAdmin() || isCompanyAdmin(co);
          }

          // products, services: company admins manage; public can read
          match /products/{p} {
            allow read: if true;
            allow create: if isSignedIn(); // you may restrict to company staff/admin
            allow update: if isSignedIn() && (isSuperAdmin() || isCompanyAdmin(resource.data.companyId));
            allow delete: if isSuperAdmin() || isCompanyAdmin(resource.data.companyId);
          }

          // inventoryBatches: staff/admin of company manage
          match /inventoryBatches/{b} {
            allow read: if isSignedIn() && (isSuperAdmin() || isCompanyAdmin(resource.data.companyId) || (request.auth.uid == resource.data.uid));
            allow create, update: if isSignedIn() && (isSuperAdmin() || isCompanyAdmin(request.resource.data.companyId));
            allow delete: if false; // prefer soft-delete
          }

          // orders, requests, payroll: restricted
          match /orders/{o} {
            allow read: if isSignedIn() && (request.auth.uid==resource.data.uid || isCompanyAdmin(resource.data.companyId) || isSuperAdmin());
            allow create: if isSignedIn();
            allow update: if isSignedIn() && (isCompanyAdmin(resource.data.companyId) || request.auth.uid==resource.data.uid || isSuperAdmin());
            allow delete: if false;
          }

          match /{document=**} { allow read: if true; }
        }
      }

      // Indexes suggestions (Firestore console may auto-propose):
      // collection: products orderBy(createdAt desc) -> index on products(createdAt desc)
      // collection: inventoryBatches where(productId==X and remain>0) orderBy(exp) -> composite index on inventoryBatches(productId ASC, remain ASC, exp ASC)
    */