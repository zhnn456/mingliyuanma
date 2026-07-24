/**
 * 中国主要城市经纬度数据
 * 用于真太阳时计算
 * offset = (longitude - 120) * 4 分钟
 */
export interface CityData {
  name: string;
  longitude: number;
  latitude: number;
  offset: number; // 分钟
}

export const CITIES: CityData[] = [
  { name: '北京', longitude: 116.4, latitude: 39.9, offset: -14.4 },
  { name: '上海', longitude: 121.5, latitude: 31.2, offset: 6.0 },
  { name: '广州', longitude: 113.3, latitude: 23.1, offset: -26.8 },
  { name: '深圳', longitude: 114.1, latitude: 22.5, offset: -23.6 },
  { name: '成都', longitude: 104.1, latitude: 30.6, offset: -63.6 },
  { name: '重庆', longitude: 106.5, latitude: 29.5, offset: -54.0 },
  { name: '天津', longitude: 117.2, latitude: 39.1, offset: -11.2 },
  { name: '武汉', longitude: 114.3, latitude: 30.6, offset: -22.8 },
  { name: '杭州', longitude: 120.2, latitude: 30.3, offset: 0.8 },
  { name: '南京', longitude: 118.8, latitude: 32.1, offset: -4.8 },
  { name: '西安', longitude: 108.9, latitude: 34.3, offset: -44.4 },
  { name: '长沙', longitude: 113.0, latitude: 28.2, offset: -28.0 },
  { name: '郑州', longitude: 113.6, latitude: 34.7, offset: -25.6 },
  { name: '沈阳', longitude: 123.4, latitude: 41.8, offset: 13.6 },
  { name: '哈尔滨', longitude: 126.6, latitude: 45.8, offset: 26.4 },
  { name: '长春', longitude: 125.3, latitude: 43.9, offset: 21.2 },
  { name: '大连', longitude: 121.6, latitude: 38.9, offset: 6.4 },
  { name: '青岛', longitude: 120.4, latitude: 36.1, offset: 1.6 },
  { name: '济南', longitude: 117.0, latitude: 36.7, offset: -12.0 },
  { name: '石家庄', longitude: 114.5, latitude: 38.0, offset: -22.0 },
  { name: '太原', longitude: 112.5, latitude: 37.9, offset: -30.0 },
  { name: '合肥', longitude: 117.3, latitude: 31.8, offset: -10.8 },
  { name: '福州', longitude: 119.3, latitude: 26.1, offset: -2.8 },
  { name: '厦门', longitude: 118.1, latitude: 24.5, offset: -7.6 },
  { name: '南昌', longitude: 115.9, latitude: 28.7, offset: -16.4 },
  { name: '昆明', longitude: 102.7, latitude: 25.0, offset: -69.2 },
  { name: '贵阳', longitude: 106.7, latitude: 26.6, offset: -53.2 },
  { name: '南宁', longitude: 108.3, latitude: 22.8, offset: -46.8 },
  { name: '海口', longitude: 110.3, latitude: 20.0, offset: -38.8 },
  { name: '兰州', longitude: 103.8, latitude: 36.1, offset: -64.8 },
  { name: '乌鲁木齐', longitude: 87.6, latitude: 43.8, offset: -129.6 },
  { name: '拉萨', longitude: 91.1, latitude: 29.6, offset: -115.6 },
  { name: '呼和浩特', longitude: 111.7, latitude: 40.8, offset: -33.2 },
  { name: '银川', longitude: 106.3, latitude: 38.5, offset: -54.8 },
  { name: '西宁', longitude: 101.8, latitude: 36.6, offset: -72.8 },
  { name: '台北', longitude: 121.5, latitude: 25.0, offset: 6.0 },
  { name: '香港', longitude: 114.2, latitude: 22.3, offset: -23.2 },
  { name: '澳门', longitude: 113.5, latitude: 22.2, offset: -26.0 },
  { name: '苏州', longitude: 120.6, latitude: 31.3, offset: 2.4 },
  { name: '无锡', longitude: 120.3, latitude: 31.6, offset: 1.2 },
  { name: '宁波', longitude: 121.5, latitude: 29.9, offset: 6.0 },
  { name: '温州', longitude: 120.7, latitude: 28.0, offset: 2.8 },
  { name: '佛山', longitude: 113.1, latitude: 23.0, offset: -27.6 },
  { name: '东莞', longitude: 113.7, latitude: 23.0, offset: -25.2 },
  { name: '珠海', longitude: 113.5, latitude: 22.3, offset: -26.0 },
  { name: '烟台', longitude: 121.4, latitude: 37.5, offset: 5.6 },
  { name: '潍坊', longitude: 119.1, latitude: 36.7, offset: -3.6 },
  { name: '唐山', longitude: 118.2, latitude: 39.6, offset: -7.2 },
  { name: '秦皇岛', longitude: 119.6, latitude: 39.9, offset: -1.6 },
  { name: '洛阳', longitude: 112.4, latitude: 34.6, offset: -30.4 },
  { name: '桂林', longitude: 110.3, latitude: 25.3, offset: -38.8 },
  { name: '三亚', longitude: 109.5, latitude: 18.2, offset: -42.0 },
  { name: '丽江', longitude: 100.2, latitude: 26.9, offset: -79.2 },
  { name: '敦煌', longitude: 94.7, latitude: 40.1, offset: -101.2 },
  { name: '延安', longitude: 109.5, latitude: 36.6, offset: -42.0 },
];

/**
 * 计算真太阳时校正（分钟）
 * @param longitude 经度
 * @returns 校正分钟数
 */
export function calcSolarTimeOffset(longitude: number): number {
  return (longitude - 120) * 4;
}

/**
 * 应用真太阳时校正
 * @param date 原始时间
 * @param offsetMinutes 校正分钟数
 * @returns 校正后的时间
 */
export function applySolarTimeCorrection(date: Date, offsetMinutes: number): Date {
  const corrected = new Date(date);
  corrected.setMinutes(corrected.getMinutes() + Math.round(offsetMinutes));
  return corrected;
}
