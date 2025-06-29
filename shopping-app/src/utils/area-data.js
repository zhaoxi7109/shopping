/**
 * 省市区数据
 * 注意：这里只提供部分示例数据，实际项目中应该使用完整的省市区数据
 */

// 省份数据
export const provinceData = [
  { code: "110000", name: "北京市" },
  { code: "120000", name: "天津市" },
  { code: "130000", name: "河北省" },
  { code: "140000", name: "山西省" },
  { code: "150000", name: "内蒙古自治区" },
  { code: "210000", name: "辽宁省" },
  { code: "220000", name: "吉林省" },
  { code: "230000", name: "黑龙江省" },
  { code: "310000", name: "上海市" },
  { code: "320000", name: "江苏省" },
  { code: "330000", name: "浙江省" },
  { code: "340000", name: "安徽省" },
  { code: "350000", name: "福建省" },
  { code: "360000", name: "江西省" },
  { code: "370000", name: "山东省" },
  { code: "410000", name: "河南省" },
  { code: "420000", name: "湖北省" },
  { code: "430000", name: "湖南省" },
  { code: "440000", name: "广东省" },
  { code: "450000", name: "广西壮族自治区" },
  { code: "460000", name: "海南省" },
  { code: "500000", name: "重庆市" },
  { code: "510000", name: "四川省" },
  { code: "520000", name: "贵州省" },
  { code: "530000", name: "云南省" },
  { code: "540000", name: "西藏自治区" },
  { code: "610000", name: "陕西省" },
  { code: "620000", name: "甘肃省" },
  { code: "630000", name: "青海省" },
  { code: "640000", name: "宁夏回族自治区" },
  { code: "650000", name: "新疆维吾尔自治区" },
  { code: "710000", name: "台湾省" },
  { code: "810000", name: "香港特别行政区" },
  { code: "820000", name: "澳门特别行政区" },
];

// 城市数据（按省份编码分组）
export const cityData = {
  110000: [{ code: "110100", name: "北京市" }],
  120000: [{ code: "120100", name: "天津市" }],
  130000: [
    { code: "130100", name: "石家庄市" },
    { code: "130200", name: "唐山市" },
    { code: "130300", name: "秦皇岛市" },
    { code: "130400", name: "邯郸市" },
    { code: "130500", name: "邢台市" },
    { code: "130600", name: "保定市" },
    { code: "130700", name: "张家口市" },
    { code: "130800", name: "承德市" },
    { code: "130900", name: "沧州市" },
    { code: "131000", name: "廊坊市" },
    { code: "131100", name: "衡水市" },
  ],
  440000: [
    { code: "440100", name: "广州市" },
    { code: "440200", name: "韶关市" },
    { code: "440300", name: "深圳市" },
    { code: "440400", name: "珠海市" },
    { code: "440500", name: "汕头市" },
    { code: "440600", name: "佛山市" },
    { code: "440700", name: "江门市" },
    { code: "440800", name: "湛江市" },
    { code: "440900", name: "茂名市" },
    { code: "441200", name: "肇庆市" },
    { code: "441300", name: "惠州市" },
    { code: "441400", name: "梅州市" },
    { code: "441500", name: "汕尾市" },
    { code: "441600", name: "河源市" },
    { code: "441700", name: "阳江市" },
    { code: "441800", name: "清远市" },
    { code: "441900", name: "东莞市" },
    { code: "442000", name: "中山市" },
    { code: "445100", name: "潮州市" },
    { code: "445200", name: "揭阳市" },
    { code: "445300", name: "云浮市" },
  ],
  310000: [{ code: "310100", name: "上海市" }],
  330000: [
    { code: "330100", name: "杭州市" },
    { code: "330200", name: "宁波市" },
    { code: "330300", name: "温州市" },
    { code: "330400", name: "嘉兴市" },
    { code: "330500", name: "湖州市" },
    { code: "330600", name: "绍兴市" },
    { code: "330700", name: "金华市" },
    { code: "330800", name: "衢州市" },
    { code: "330900", name: "舟山市" },
    { code: "331000", name: "台州市" },
    { code: "331100", name: "丽水市" },
  ],
  // 其他省份的城市数据...
};

// 区县数据（按城市编码分组）
export const districtData = {
  110100: [
    { code: "110101", name: "东城区" },
    { code: "110102", name: "西城区" },
    { code: "110105", name: "朝阳区" },
    { code: "110106", name: "丰台区" },
    { code: "110107", name: "石景山区" },
    { code: "110108", name: "海淀区" },
    { code: "110109", name: "门头沟区" },
    { code: "110111", name: "房山区" },
    { code: "110112", name: "通州区" },
    { code: "110113", name: "顺义区" },
    { code: "110114", name: "昌平区" },
    { code: "110115", name: "大兴区" },
    { code: "110116", name: "怀柔区" },
    { code: "110117", name: "平谷区" },
    { code: "110118", name: "密云区" },
    { code: "110119", name: "延庆区" },
  ],
  440100: [
    { code: "440103", name: "荔湾区" },
    { code: "440104", name: "越秀区" },
    { code: "440105", name: "海珠区" },
    { code: "440106", name: "天河区" },
    { code: "440111", name: "白云区" },
    { code: "440112", name: "黄埔区" },
    { code: "440113", name: "番禺区" },
    { code: "440114", name: "花都区" },
    { code: "440115", name: "南沙区" },
    { code: "440117", name: "从化区" },
    { code: "440118", name: "增城区" },
  ],
  440300: [
    { code: "440303", name: "罗湖区" },
    { code: "440304", name: "福田区" },
    { code: "440305", name: "南山区" },
    { code: "440306", name: "宝安区" },
    { code: "440307", name: "龙岗区" },
    { code: "440308", name: "盐田区" },
    { code: "440309", name: "龙华区" },
    { code: "440310", name: "坪山区" },
    { code: "440311", name: "光明区" },
  ],
  330100: [
    { code: "330102", name: "上城区" },
    { code: "330103", name: "下城区" },
    { code: "330104", name: "江干区" },
    { code: "330105", name: "拱墅区" },
    { code: "330106", name: "西湖区" },
    { code: "330108", name: "滨江区" },
    { code: "330109", name: "萧山区" },
    { code: "330110", name: "余杭区" },
    { code: "330111", name: "富阳区" },
    { code: "330112", name: "临安区" },
    { code: "330122", name: "桐庐县" },
    { code: "330127", name: "淳安县" },
    { code: "330182", name: "建德市" },
  ],
  // 其他城市的区县数据...
};

/**
 * 根据省市区代码获取名称
 * @param {string} code 地区代码
 * @returns {string} 地区名称
 */
export function getAreaNameByCode(code) {
  if (!code) return "";

  // 省级
  if (code.endsWith("0000")) {
    const province = provinceData.find((item) => item.code === code);
    return province ? province.name : "";
  }

  // 市级
  if (code.endsWith("00")) {
    for (const provinceCode in cityData) {
      const city = cityData[provinceCode].find((item) => item.code === code);
      if (city) return city.name;
    }
    return "";
  }

  // 区县级
  for (const cityCode in districtData) {
    const district = districtData[cityCode].find((item) => item.code === code);
    if (district) return district.name;
  }

  return "";
}

/**
 * 根据省市区名称获取代码
 * @param {string} provinceName 省份名称
 * @param {string} cityName 城市名称
 * @param {string} districtName 区县名称
 * @returns {object} 包含省市区代码的对象
 */
export function getAreaCodeByName(provinceName, cityName, districtName) {
  const result = {
    provinceCode: "",
    cityCode: "",
    districtCode: "",
  };

  // 查找省份代码
  const province = provinceData.find((item) => item.name === provinceName);
  if (!province) return result;

  result.provinceCode = province.code;

  // 查找城市代码
  const cities = cityData[province.code] || [];
  const city = cities.find((item) => item.name === cityName);
  if (!city) return result;

  result.cityCode = city.code;

  // 查找区县代码
  const districts = districtData[city.code] || [];
  const district = districts.find((item) => item.name === districtName);
  if (district) {
    result.districtCode = district.code;
  }

  return result;
}
