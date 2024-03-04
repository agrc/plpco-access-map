const { mergeConfig } = require('vite');

module.exports = {
  async viteFinal(config, { configType }) {
    return mergeConfig(config, {});
  },

  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],

  env: (config) => ({
    ...config,
    VITE_APP_DEPLOY: 'DEV',
  }),

  framework: {
    name: '@storybook/react-vite',
    options: {}
  },

  docs: {
    autodocs: true
  }
};
