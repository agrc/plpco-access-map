module.exports = {
  "stories": ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  "addons": ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/preset-create-react-app"],
  core: {
    builder: "webpack5"
  },
  env: (config) => ({
    ...config,
    REACT_APP_DEPLOY: 'DEV'
  })
};
