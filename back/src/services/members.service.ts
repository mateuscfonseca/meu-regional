/**
 * Members Service - Lógica de negócio de membros
 * 
 * Encapsula toda a lógica de CRUD de membros
 */

import { getDb } from '../db-provider';

export interface Member {
  id: number;
  regional_id: number;
  nome: string;
  username: string;
  instrumento: string;
  criado_em: string;
}

export interface CreateMemberInput {
  regional_id: number;
  nome: string;
  username: string;
  password: string;
  instrumento: string;
}

export interface UpdateMemberInput {
  nome?: string;
  instrumento?: string;
}

export class MembersService {
  private db: any;

  constructor() {
    this.db = getDb();
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
   * Lista todos os membros de uma regional
   */
  async findByRegional(regionalId: number): Promise<Member[]> {
    return this.db
      .prepare(`
        SELECT id, nome, username, instrumento, criado_em
        FROM members
        WHERE regional_id = ?
        ORDER BY nome
      `)
      .all(regionalId) as Member[];
  }

  /**
   * Busca membro por ID
   */
  async findById(id: number): Promise<Member | null> {
    const member = this.db
      .prepare('SELECT id, nome, username, instrumento, regional_id, criado_em FROM members WHERE id = ?')
      .get(id) as Member | undefined;

    return member || null;
  }

  /**
   * Busca membro por username
   */
  async findByUsername(username: string): Promise<Member | null> {
    const member = this.db
      .prepare('SELECT id, nome, username, instrumento, regional_id, criado_em FROM members WHERE username = ?')
      .get(username) as Member | undefined;

    return member || null;
  }

  /**
   * Verifica se username existe
   */
  async usernameExists(username: string): Promise<boolean> {
    const existing = this.db
      .prepare('SELECT id FROM members WHERE username = ?')
      .get(username);

    return !!existing;
  }

  /**
   * Cria novo membro
   */
  async create(input: CreateMemberInput): Promise<Member> {
    // Verificar se username já existe
    if (await this.usernameExists(input.username)) {
      throw new Error('Username já existe');
    }

    // Hash da senha
    const passwordHash = await this.hashPassword(input.password);

    const result = this.db
      .prepare('INSERT INTO members (regional_id, nome, username, password_hash, instrumento) VALUES (?, ?, ?, ?, ?)')
      .run(input.regional_id, input.nome, input.username, passwordHash, input.instrumento);

    return this.findById(result.lastInsertRowid as number) as Promise<Member>;
  }

  /**
   * Atualiza membro
   */
  async update(id: number, input: UpdateMemberInput): Promise<Member | null> {
    const member = await this.findById(id);

    if (!member) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (input.nome !== undefined) {
      fields.push('nome = ?');
      values.push(input.nome);
    }
    if (input.instrumento !== undefined) {
      fields.push('instrumento = ?');
      values.push(input.instrumento);
    }

    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP');
      values.push(id);

      this.db.prepare(`UPDATE members SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id);
  }

  /**
   * Deleta membro
   */
  async delete(id: number): Promise<boolean> {
    const member = await this.findById(id);

    if (!member) {
      return false;
    }

    this.db.prepare('DELETE FROM members WHERE id = ?').run(id);
    return true;
  }
}

// Singleton exportado
export const membersService = new MembersService();
