export default [
    {
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                chrome: "readonly",
                console: "readonly",
                document: "readonly",
                window: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
                Date: "readonly",
                parseInt: "readonly",
                parseFloat: "readonly",
                isNaN: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "error",
            "no-undef": "error",
            "no-console": "warn",
            "eqeqeq": "error",
            "curly": "error",
            "no-var": "error",
            "prefer-const": "error",
            "no-trailing-spaces": "error",
            "indent": ["error", 4],
            "quotes": ["error", "double"],
            "semi": ["error", "always"]
        }
    },
    {
        files: ["webpack.config.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                __dirname: "readonly",
                module: "readonly",
                require: "readonly",
                process: "readonly"
            }
        }
    },
    {
        files: ["tests/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                describe: "readonly",
                test: "readonly",
                expect: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                jest: "readonly"
            }
        }
    }
];
