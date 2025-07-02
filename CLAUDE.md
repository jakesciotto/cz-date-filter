# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Chrome extension called "CloudZero Date Filter" that allows users to save and apply custom date filters to CloudZero Explorer. The extension provides a popup interface for selecting date ranges and applies them to the CloudZero web application by modifying URL parameters.

## Architecture

The extension consists of:
- **popup.html/popup.js**: Main interface for selecting date ranges, saving filters, and applying them
- **manifest.json**: Chrome extension configuration with permissions for storage and tabs
- **styles.css**: UI styling with modern design using CSS variables

### Key Components

**Date Range Logic (popup.js:112-141)**: The `findValid28DayWindow()` function implements special logic to find a valid 28-day period that contains exactly 4 full weekends and 4 full weeks, stepping back day by day until finding a valid window.

**URL Manipulation (popup.js:144-228)**: The apply button handler constructs CloudZero URLs with specific query parameters:
- Formats dates to CloudZero's ISO format with proper timezone handling
- Fixes encoding issues (replaces `+` with `%20`, removes over-encoding `%25`)
- Sets required parameters: `activeCostType=real_cost`, `granularity=daily`

**Storage Management**: Uses Chrome's sync storage to persist saved filters with custom names and date ranges.

## Development

To test changes:
1. Make code modifications
2. Go to `chrome://extensions/`
3. Click "Reload" button for the extension to apply changes
4. Test the popup and URL generation on CloudZero pages

The extension targets `https://app.cloudzero.com/*` URLs and requires specific URL parameter formatting for proper CloudZero integration.

## Project Structure Notes

- The HTML and CSS are separated to maintain a clean, modular architecture
  - `popup.html` focuses on the structure and content of the popup interface
  - `styles.css` handles all styling concerns, allowing for easier maintenance and potential theme/style updates
  - This separation follows web development best practices of keeping structure (HTML), presentation (CSS), and behavior (JS) distinct

## Recent Work

- Committed recent branch work, updating core extension functionality and refining date range selection logic