const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * 简单的文件数据存储工具
 * 用于模拟数据库操作，将数据存储在JSON文件中
 */
class DataStore {
  constructor() {
    this.dataDir = path.join(__dirname, "../data");
    this.ensureDataDir();
  }

  /**
   * 确保数据目录存在
   */
  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 获取文件路径
   */
  getFilePath(collection) {
    return path.join(this.dataDir, `${collection}.json`);
  }

  /**
   * 读取集合数据
   */
  read(collection) {
    try {
      const filePath = this.getFilePath(collection);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`读取${collection}数据失败:`, error);
      return [];
    }
  }

  /**
   * 写入集合数据
   */
  write(collection, data) {
    try {
      const filePath = this.getFilePath(collection);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch (error) {
      console.error(`写入${collection}数据失败:`, error);
      return false;
    }
  }

  /**
   * 查找所有记录
   */
  findAll(collection) {
    return this.read(collection);
  }

  /**
   * 根据ID查找记录
   */
  findById(collection, id) {
    const data = this.read(collection);
    return data.find((item) => item.id === id);
  }

  /**
   * 根据条件查找记录
   */
  findOne(collection, query) {
    const data = this.read(collection);
    return data.find((item) => {
      return Object.keys(query).every((key) => item[key] === query[key]);
    });
  }

  /**
   * 根据条件查找多条记录
   */
  find(collection, query = {}) {
    const data = this.read(collection);
    if (Object.keys(query).length === 0) {
      return data;
    }
    return data.filter((item) => {
      return Object.keys(query).every((key) => {
        if (typeof query[key] === "object" && query[key].$regex) {
          const regex = new RegExp(
            query[key].$regex,
            query[key].$options || "i"
          );
          return regex.test(item[key]);
        }
        return item[key] === query[key];
      });
    });
  }

  /**
   * 创建新记录
   */
  create(collection, item) {
    const data = this.read(collection);
    const newItem = {
      id: uuidv4(),
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.push(newItem);
    this.write(collection, data);
    return newItem;
  }

  /**
   * 更新记录
   */
  update(collection, id, updates) {
    const data = this.read(collection);
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }
    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.write(collection, data);
    return data[index];
  }

  /**
   * 删除记录
   */
  delete(collection, id) {
    const data = this.read(collection);
    const index = data.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }
    data.splice(index, 1);
    this.write(collection, data);
    return true;
  }

  /**
   * 分页查询
   */
  paginate(collection, query = {}, page = 1, limit = 10) {
    const allData = this.find(collection, query);
    const total = allData.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = allData.slice(offset, offset + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

// 创建单例实例
const dataStore = new DataStore();

// 数据文件路径
const dataFiles = {
  users: path.join(__dirname, "../data/users.json"),
  products: path.join(__dirname, "../data/products.json"),
  categories: path.join(__dirname, "../data/categories.json"),
  cart: path.join(__dirname, "../data/cart.json"),
  orders: path.join(__dirname, "../data/orders.json"),
  reviews: path.join(__dirname, "../data/reviews.json"),
};

module.exports = dataStore;
