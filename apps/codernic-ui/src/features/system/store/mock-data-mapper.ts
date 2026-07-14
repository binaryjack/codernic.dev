import mockData from '../../../../../../private_docs/mock_data_combinations.json';

export const getMockData = (widget: string, combinationKey: string) => {
  const widgetConfig = (mockData.widgets as any)[widget];
  if (!widgetConfig) return null;
  return {
    slice: widgetConfig.slice,
    data: widgetConfig.combinations[combinationKey] || null
  };
};
