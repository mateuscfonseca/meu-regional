/**
 * Auth Service - Lógica de negócio de autenticação
 * 
 * Encapsula toda a lógica de autenticação, registro e gerenciamento de usuários
 */

import { getDb } from '../db-provider';
import { sign, verify } from 'hono/jwt';

export interface User {
  id: number;
  username: string;
  nome: string;
  instrumento: string;
  regional_id: number;
}

export interface RegisterInput {
  regionalNome: string;
  regionalDescricao?: string;
  membroNome: string;
  username: string;
  password: string;
  instrumento: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export class AuthService {
  private db: any;

  constructor() {
    this.db = getDb();
  }

  /**
   * Obtém a chave secreta JWT dinamicamente
   */
  private getJwtSecret(): string {
    return process.env.JWT_SECRET || 'fallback-secret';
  }

  /**
   * Gera hash SHA-256 da senha
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Gera JWT token
   */
  private async generateToken(user: User): Promise<string> {
    return sign(
      {
        id: user.id,
        username: user.username,
        regional_id: user.regional_id,
      },
      this.getJwtSecret()
    );
  }

  /**
   * Verifica JWT token
   */
  async verifyToken(token: string): Promise<{ id: number; username: string; regional_id: number }> {
    return verify(token, this.getJwtSecret(), 'HS256');
  }

  /**
   * Registra novo usuário e regional
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    // Verificar se username já existe
    const existingMember = this.db
      .prepare('SELECT id FROM members WHERE username = ?')
      .get(input.username);

    if (existingMember) {
      throw new Error('Username já existe');
    }

    // Hash da senha
    const passwordHash = await this.hashPassword(input.password);

    // Transação para criar regional e membro
    const insertRegional = this.db.prepare(
      'INSERT INTO regionais (nome, descricao) VALUES (?, ?)'
    );
    const insertMember = this.db.prepare(
      'INSERT INTO members (regional_id, nome, username, password_hash, instrumento) VALUES (?, ?, ?, ?, ?)'
    );

    const regionalResult = insertRegional.run(input.regionalNome, input.regionalDescricao || null);
    insertMember.run(regionalResult.lastInsertRowid, input.membroNome, input.username, passwordHash, input.instrumento);

    const member = this.db
      .prepare('SELECT id, nome, username, instrumento, regional_id FROM members WHERE username = ?')
      .get(input.username) as any;

    const token = await this.generateToken(member);

    return {
      user: {
        id: member.id,
        username: member.username,
        nome: member.nome,
        instrumento: member.instrumento,
        regional_id: member.regional_id,
      },
      token,
    };
  }

  /**
   * Realiza login
   */
  async login(input: LoginInput): Promise<AuthResult> {
    // Hash da senha fornecida
    const passwordHash = await this.hashPassword(input.password);

    // Buscar membro
    const member = this.db
      .prepare('SELECT id, nome, username, instrumento, regional_id, password_hash FROM members WHERE username = ?')
      .get(input.username) as any;

    if (!member || member.password_hash !== passwordHash) {
      throw new Error('Credenciais inválidas');
    }

    const token = await this.generateToken(member);

    return {
      user: {
        id: member.id,
        username: member.username,
        nome: member.nome,
        instrumento: member.instrumento,
        regional_id: member.regional_id,
      },
      token,
    };
  }

  /**
   * Verifica autenticação e retorna usuário
   */
  async me(token: string): Promise<User> {
    const payload = await this.verifyToken(token);

    const member = this.db
      .prepare('SELECT id, nome, username, instrumento, regional_id FROM members WHERE id = ?')
      .get(payload.id) as any;

    if (!member) {
      throw new Error('Usuário não encontrado');
    }

    return {
      id: member.id,
      username: member.username,
      nome: member.nome,
      instrumento: member.instrumento,
      regional_id: member.regional_id,
    };
  }

  /**
   * Busca usuário por ID
   */
  async findById(id: number): Promise<User | null> {
    const member = this.db
      .prepare('SELECT id, nome, username, instrumento, regional_id FROM members WHERE id = ?')
      .get(id) as any;

    if (!member) {
      return null;
    }

    return {
      id: member.id,
      username: member.username,
      nome: member.nome,
      instrumento: member.instrumento,
      regional_id: member.regional_id,
    };
  }

  /**
   * Busca usuário por username
   */
  async findByUsername(username: string): Promise<User | null> {
    const member = this.db
      .prepare('SELECT id, nome, username, instrumento, regional_id FROM members WHERE username = ?')
      .get(username) as any;

    if (!member) {
      return null;
    }

    return {
      id: member.id,
      username: member.username,
      nome: member.nome,
      instrumento: member.instrumento,
      regional_id: member.regional_id,
    };
  }
}

// Singleton exportado
export const authService = new AuthService();
