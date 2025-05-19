// @ts-check
import { mergeConfig } from 'vite';

/** @type {import('@storybook/react-vite').StorybookConfig} */
export default {
  async viteFinal(config) {
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
    options: {},
  },

  docs: {},
};
