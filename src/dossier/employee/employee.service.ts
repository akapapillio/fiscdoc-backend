import { Injectable, Inject } from '@nestjs/common';
// import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(@Inject('DATABASE_CONNECTION2') private db2: any) {}

  // 1. LIRE : Récupérer les employés avec leur affectation active
  async findAll() {
    const connection = await this.db2.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT 
          e.id, e.first_name, e.last_name, e.email, e.matricule, e.is_active,
          ea.division_id, ea.role_id
        FROM employees e
        LEFT JOIN employee_assignments ea 
          ON e.id = ea.employee_id AND ea.end_date IS NULL
        ORDER BY e.created_at DESC
      `);

      // On formate le résultat pour que React reçoive l'objet "active_assignment" attendu
      return rows.map((row: any) => ({
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        matricule: row.matricule,
        is_active: Boolean(row.is_active),
        active_assignment: (row.division_id && row.role_id) 
          ? { division_id: row.division_id, role_id: row.role_id } 
          : null
      }));
    } finally {
      connection.release();
    }
  }

  // 2. CRÉER : Hachage du mot de passe + Création de l'affectation
  async create(data: any) {
    const connection = await this.db2.getConnection();
    await connection.beginTransaction();
    try {
      // Hachage du mot de passe
      const saltRounds = 10;
    //   const passwordHash = await bcrypt.hash(data.password, saltRounds);
         const passwordHash = data.password ;
      const [empResult] = await connection.query(
        `INSERT INTO employees (first_name, last_name, email, password_hash, matricule, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.first_name, data.last_name, data.email, passwordHash, data.matricule || null, data.is_active]
      );
      
      const newEmpId = empResult.insertId;

      // Création de l'affectation initiale
      if (data.division_id && data.role_id) {
        await connection.query(
          `INSERT INTO employee_assignments (employee_id, division_id, role_id, start_date) 
           VALUES (?, ?, ?, CURDATE())`,
          [newEmpId, data.division_id, data.role_id]
        );
      }

      await connection.commit();
      return { id: newEmpId, message: 'Employé créé avec succès' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 3. MODIFIER : Mise à jour + Historisation intelligente de l'affectation
  async update(id: number, data: any) {
    const connection = await this.db2.getConnection();
    await connection.beginTransaction();
    try {
      // A. Mise à jour des infos de base
      let sql = `UPDATE employees SET first_name=?, last_name=?, email=?, matricule=?, is_active=?`;
      const params: any[] = [data.first_name, data.last_name, data.email, data.matricule || null, data.is_active];

      // Si l'admin a tapé un nouveau mot de passe, on le hache et on l'ajoute à la requête
      if (data.password && data.password.trim() !== '') {
        // const passwordHash = await bcrypt.hash(data.password, 10);
        const passwordHash = data.password ; 
        sql += `, password_hash=?`;
        params.push(passwordHash);
      }

      sql += ` WHERE id=?`;
      params.push(id);
      await connection.query(sql, params);

      // B. Gestion de l'affectation (RH)
      if (data.division_id && data.role_id) {
        // Chercher l'affectation active actuelle
        const [currAssigns] = await connection.query(
          `SELECT id, division_id, role_id FROM employee_assignments 
           WHERE employee_id = ? AND end_date IS NULL`,
          [id]
        );

        let needsNewAssignment = false;

        if (currAssigns.length > 0) {
          const curr = currAssigns[0];
          // Si la division ou le rôle a changé, on clôture l'ancienne et on en crée une nouvelle
          if (curr.division_id !== Number(data.division_id) || curr.role_id !== Number(data.role_id)) {
            await connection.query(`UPDATE employee_assignments SET end_date = CURDATE() WHERE id = ?`, [curr.id]);
            needsNewAssignment = true;
          }
        } else {
          // Aucune affectation active trouvée, il faut en créer une
          needsNewAssignment = true;
        }

        if (needsNewAssignment) {
          await connection.query(
            `INSERT INTO employee_assignments (employee_id, division_id, role_id, start_date) 
             VALUES (?, ?, ?, CURDATE())`,
            [id, data.division_id, data.role_id]
          );
        }
      }

      await connection.commit();
      return { message: 'Employé mis à jour' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}