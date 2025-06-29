/**
 * 图片处理工具函数
 */

// 服务器基础URL
const SERVER_BASE_URL = "http://localhost:3000";

/**
 * 将相对路径转换为完整的图片URL
 * @param {string} imagePath - 图片相对路径
 * @returns {string} 完整的图片URL
 */
export function getImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // 如果是相对路径，拼接服务器基础URL
  if (imagePath.startsWith("/")) {
    return SERVER_BASE_URL + imagePath;
  }

  // 如果不是以/开头，添加/
  return SERVER_BASE_URL + "/" + imagePath;
}

/**
 * 批量处理图片URL
 * @param {Array} items - 包含图片路径的对象数组
 * @param {string} imageField - 图片字段名，默认为'image'
 * @returns {Array} 处理后的数组
 */
export function processImageUrls(items, imageField = "image") {
  if (!Array.isArray(items)) {
    return items;
  }

  return items.map((item) => {
    if (item && item[imageField]) {
      return {
        ...item,
        [imageField]: getImageUrl(item[imageField]),
      };
    }
    return item;
  });
}

/**
 * 处理单个对象的图片URL
 * @param {Object} item - 包含图片路径的对象
 * @param {string|Array} imageFields - 图片字段名或字段名数组
 * @returns {Object} 处理后的对象
 */
export function processImageUrl(item, imageFields = "image") {
  if (!item) {
    return item;
  }

  const fields = Array.isArray(imageFields) ? imageFields : [imageFields];
  const processedItem = { ...item };

  fields.forEach((field) => {
    if (processedItem[field]) {
      processedItem[field] = getImageUrl(processedItem[field]);
    }
  });

  return processedItem;
}

export default {
  getImageUrl,
  processImageUrls,
  processImageUrl,
};
