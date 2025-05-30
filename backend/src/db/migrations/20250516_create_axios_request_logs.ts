/**
 * 创建axios_request_logs表
 * 用于记录所有axios请求和响应信息，确保金融交易数据不会丢失
 */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 创建表
  return knex.schema.createTable('axios_request_logs', (table) => {
    table.increments('id').primary();
    table.string('url', 1000).notNullable().comment('请求URL，包含查询参数');
    table.string('method', 20).notNullable().comment('请求方法（GET, POST等）');
    table.integer('duration_ms').notNullable().comment('请求耗时（毫秒）');
    table.integer('status_code').nullable().comment('HTTP响应状态码');
    table.text('request_body').nullable().comment('请求体（JSON字符串）');
    table.text('response_body').nullable().comment('响应体（JSON字符串）');
    table.text('request_headers').nullable().comment('请求头（JSON字符串）');
    table.text('response_headers').nullable().comment('响应头（JSON字符串）');
    table.string('error_message', 1000).nullable().comment('错误信息（如果有）');
    table.boolean('success').notNullable().defaultTo(false).comment('请求是否成功');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('创建时间');
    
    // 为大多数字段创建索引
    table.index('created_at');
    table.index('method');
    table.index('status_code');
    table.index('success');
    
    // 在SQLite环境下为url创建索引（MySQL环境将在表创建后处理）
    const isMysql = knex.client.config.client.includes('mysql');
    if (!isMysql) {
      table.index('url');
    }
  }).then(async () => {
    // 在MySQL环境中为url字段创建前缀索引
    const isMysql = knex.client.config.client.includes('mysql');
    if (isMysql) {
      await knex.schema.raw('CREATE INDEX `axios_request_logs_url_index` ON `axios_request_logs`(`url`(255))');
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('axios_request_logs');
}