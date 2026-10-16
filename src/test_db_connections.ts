import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';

// Charge les variables du fichier .env
dotenv.config();

interface DbConfig {
  name: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

const dbConfigs: DbConfig[] = [
  {
    name: 'Base Primaire (DB 1)',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  {
    name: 'Base Secondaire Client (DB 2)',
    host: process.env.DB2_HOST,
    port: Number(process.env.DB2_PORT) || 3306,
    user: process.env.DB2_USER,
    password: process.env.DB2_PASSWORD,
    database: process.env.DB2_NAME,
  },
];

async function checkDatabase(config: DbConfig): Promise<boolean> {
  console.log(`\n--- Test de connexion : ${config.name} ---`);
  console.log(`Cible : ${config.user}@${config.host}:${config.port}/${config.database}`);

  let pool: mysql.Pool | null = null;

  try {
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 1,
      connectTimeout: 5000, // Timeout de 5 secondes si l'hôte ne répond pas
    });

    // Exécution d'une requête basique pour valider la session active
    const [rows] = await pool.query('SELECT 1 + 1 AS testResult');
    console.log(`[SUCCÈS] Connexion établie avec succès sur ${config.name}.`);
    return true;
  } catch (error: any) {
    console.error(`[ÉCHEC] Impossible de se connecter à ${config.name}`);
    console.error(`Raison : ${error.message} (Code: ${error.code || 'INCONNU'})`);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

async function runDiagnostics() {
  console.log('Démarrage du diagnostic des bases de données MySQL...');
  
  const results = await Promise.all(dbConfigs.map((db) => checkDatabase(db)));
  
  console.log('\n================ RÉSULTAT DU TEST ================');
  const allSucceeded = results.every(Boolean);
  
  if (allSucceeded) {
    console.log('Toutes les connexions MySQL fonctionnent parfaitement.');
    process.exit(0);
  } else {
    console.error('Une ou plusieurs bases de données sont inaccessibles.');
    process.exit(1);
  }
}

runDiagnostics();