// Fills in the site admin list, each league's member roles and members' saved names, which the database rules rely on.
// Safe to run more than once.
//
// Against the local emulators (npm run emulators running):
//   FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 GCLOUD_PROJECT=such-frolf-fb20a node scripts/bootstrapAccess.js
// Against the real database, with credentials (gcloud auth application-default login):
//   GCLOUD_PROJECT=such-frolf-fb20a DATABASE_URL=https://such-frolf-fb20a-default-rtdb.firebaseio.com node scripts/bootstrapAccess.js
// Or sign in as the site owner and use "Run access setup" under Site admin, then Site settings.
const path = require('path')
const { bootstrap } = require(path.join(__dirname, '..', 'functions', 'bootstrap'))

bootstrap()
  .then(result => { console.log('Done', result); process.exit(0) })
  .catch(error => { console.error(error); process.exit(1) })
