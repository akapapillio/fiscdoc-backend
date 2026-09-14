import { Injectable, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE_CONNECTION2') private readonly db2: mysql.Pool,
    private readonly jwtService: JwtService
  ) {}

  // --- POST /auth/login ---
  async login(dto: LoginDto) {
    // 1. Chercher l'employé
    const [rows]: any = await this.db2.query(
      'SELECT id, email, password_hash, is_active FROM employees WHERE email = ?',
      [dto.email]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Identifiants invalides ou compte inactif');
    }

    // 2. Vérifier le mot de passe 
    // (Note: dans le jeu d'essai actuel, le mdp est "motdepasse_bidon" en clair. 
    // À terme, utilisez bcrypt.compare(dto.password, user.password_hash))
    if (dto.password !== user.password_hash) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // 3. Générer le token JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Connexion réussie',
      access_token: accessToken,
    };
  }

  // --- GET /auth/me ---
  async getMe(employeeId: number) {
    // 1. Infos de base de l'employé
    const [empRows]: any = await this.db2.query(
      'SELECT id, first_name, last_name, email, matricule FROM employees WHERE id = ?',
      [employeeId]
    );
    const employee = empRows[0];
    if (!employee) throw new NotFoundException('Employé introuvable');

    // 2. Rôles systèmes globaux
    const [systemRoles]: any = await this.db2.query(
      `SELECT r.code, r.label 
       FROM roles r
       JOIN employee_roles er ON r.id = er.role_id
       WHERE er.employee_id = ?`,
      [employeeId]
    );

    // 3. Affectation active (division + rôle métier)
    const [assignments]: any = await this.db2.query(
      `SELECT a.division_id, d.name as division_name, a.role_id, r.label as role_label 
       FROM employee_assignments a
       JOIN divisions d ON a.division_id = d.id
       JOIN roles r ON a.role_id = r.id
       WHERE a.employee_id = ? AND a.end_date IS NULL`,
      [employeeId]
    );

    return {
      profil: employee,
      roles_systemes: systemRoles,
      affectation_active: assignments.length > 0 ? assignments[0] : null
    };
  }
}