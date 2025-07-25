// 视频资源映射常量
export const VIDEO_RESOURCES: Record<string, string> = {
  // 种子阶段
  'plant-seed-happy': '/plantsVideo/seed_happy.mp4',
  'plant-seed-normal': '/plantsVideo/seed_normal.mp4',
  'plant-seed-sad': '/plantsVideo/seed_sad.mp4',
  // 幼苗阶段
  'plant-sprout-happy': '/plantsVideo/sprout_happy.mp4',
  'plant-sprout-normal': '/plantsVideo/sprout_normal.mp4',
  'plant-sprout-sad': '/plantsVideo/sprout_sad.mp4',
  // 成熟阶段
  'plant-mature-happy': '/plantsVideo/mature_happy.mp4',
  'plant-mature-normal': '/plantsVideo/mature_normal.mp4',
  'plant-mature-sad': '/plantsVideo/mature_sad.mp4',
  // 开花阶段
  'plant-flowering-happy': '/plantsVideo/flowering_happy.mp4',
  'plant-flowering-normal': '/plantsVideo/flowering_normal.mp4',
  'plant-flowering-sad': '/plantsVideo/flowering_sad.mp4',
  // 结束阶段（fruiting）- 暂时使用开花阶段的视频作为占位符
  'plant-fruiting-happy': '/plantsVideo/flowering_happy.mp4',
  'plant-fruiting-normal': '/plantsVideo/flowering_normal.mp4',
  'plant-fruiting-sad': '/plantsVideo/flowering_sad.mp4'
}

// 获取资源URL
export const getResourceUrl = (resourceId: string): string | null => {
  return VIDEO_RESOURCES[resourceId] || null
}
