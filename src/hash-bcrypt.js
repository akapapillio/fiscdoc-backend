const bcrypt = require('bcrypt');

const secret = 'admin-secret-CHANGE-ME'; // Le secret que vous voulez hacher
const saltRounds = 10;

bcrypt.hash(secret, saltRounds, (err, hash) => {
  if (err) {
    console.error("Erreur lors du hachage :", err);
    return;
  }
  console.log(`Secret en clair : ${secret}`);
  console.log(`Hash Bcrypt    : ${hash}`);
  console.log("\nCopiez ce hash dans votre fichier seeds.sql ou directement dans votre base de données.");
});

// commande
// node hash-bcrypt.js
