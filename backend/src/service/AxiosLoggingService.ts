/**
 * Axios日志服务
 * 用于记录所有axios请求和响应，确保金融交易数据不会丢失
 */
import db from '../db/db';

export interface AxiosRequestLog {
  url: string;
  method: string;
  duration_ms: number;
  status_code?: number;
  request_body?: string;
  response_body?: string;
  request_headers?: string;
  response_headers?: string;
  error_message?: string;
  success: boolean; // 修改字段名，与数据库列名保持一致
}

export class AxiosLoggingService {
  /**
   * 记录axios请求日志
   * @param logData 日志数据
   */
  static async logRequest(logData: AxiosRequestLog): Promise<number> {
    try {
      console.log(`记录API请求日志: ${logData.method} ${logData.url} - 耗时: ${logData.duration_ms}ms - 状态: ${logData.status_code || 'N/A'}`);
      
      // 创建日志记录
      const [logId] = await db('axios_request_logs').insert(logData);
      
      console.log(`API请求日志记录成功，ID: ${logId}`);
      return logId;
    } catch (error) {
      // 即使日志记录失败，也不应该影响主要业务流程
      console.error('记录API请求日志失败:', error);
      return 0;
    }
  }

  /**
   * 获取指定时间范围内的请求日志
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param page 页码
   * @param pageSize 每页条数
   */
  static async getRequestLogs(
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    pageSize: number = 50
  ) {
    try {
      const query = db('axios_request_logs')
        .select('*')
        .orderBy('created_at', 'desc');
      
      // 添加日期过滤
      if (startDate) {
        query.where('created_at', '>=', startDate);
      }
      
      if (endDate) {
        query.where('created_at', '<=', endDate);
      }
      
      // 分页
      const offset = (page - 1) * pageSize;
      query.limit(pageSize).offset(offset);
      
      // 获取总记录数
      const countQuery = db('axios_request_logs').count('id as total');
      
      if (startDate) {
        countQuery.where('created_at', '>=', startDate);
      }
      
      if (endDate) {
        countQuery.where('created_at', '<=', endDate);
      }
      
      const [countResult] = await countQuery;
      const total = (countResult as any).total || 0;
      
      const logs = await query;
      
      return {
        logs,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('获取API请求日志失败:', error);
      throw error;
    }
  }
}