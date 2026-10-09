import db from '../db/connection.js';

export const SQL = {
  totalOrders: `
    SELECT COUNT(*) AS total_orders
    FROM orders`,

  totalRevenue: `
    SELECT ROUND(SUM(amount), 2) AS total_revenue
    FROM orders`,

  topProducts: `
    SELECT product,
           COUNT(*) AS orders,
           ROUND(SUM(amount), 2) AS revenue
    FROM orders
    GROUP BY product
    ORDER BY revenue DESC
    LIMIT 5`,

  ordersPerDay: `
    SELECT date(created_at) AS day,
           COUNT(*) AS orders
    FROM orders
    WHERE date(created_at) >= date('now', '-6 days')
    GROUP BY day
    ORDER BY day`,
}; // Exported so the exact SQL can be pasted into the README

export function getReportData() {
  return {
    totalOrders: db.prepare(SQL.totalOrders).get().total_orders,
    totalRevenue: db.prepare(SQL.totalRevenue).get().total_revenue,
    topProducts: db.prepare(SQL.topProducts).all(),
    ordersPerDay: db.prepare(SQL.ordersPerDay).all(),
  };
} // Turns 200 order rows into the four numbers the report needs
