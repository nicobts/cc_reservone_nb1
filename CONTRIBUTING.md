# Contributing to ReservOne

Thank you for considering contributing to ReservOne! This document outlines the process and guidelines for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/reservone/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

### Suggesting Features

1. Check existing [Issues](https://github.com/yourusername/reservone/issues) and [Discussions](https://github.com/yourusername/reservone/discussions)
2. Create a new discussion with:
   - Clear use case description
   - Proposed solution
   - Alternative approaches considered
   - Impact on existing features

### Pull Requests

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/reservone.git
   cd reservone
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Set Up Development Environment**
   ```bash
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run db:push
   npm run dev
   ```

4. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style (enforced by Biome)
   - Add tests for new features
   - Update documentation as needed

5. **Test Your Changes**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

6. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

7. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a pull request on GitHub with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/videos if applicable
   - Checklist of changes

## Development Guidelines

### Code Style

- We use **Biome** for linting and formatting
- Run `npm run lint:fix` before committing
- TypeScript strict mode is enabled
- Use meaningful variable and function names
- Add comments for complex logic

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for all components
- Follow the existing folder structure

### Database Changes

- Always create migrations for schema changes
- Test migrations before committing
- Document breaking changes
- Update seed data if needed

### Testing

- Write unit tests for utilities and hooks
- Write integration tests for API routes
- Write E2E tests for critical user flows
- Aim for >80% code coverage

### Documentation

- Update README.md for new features
- Add JSDoc comments for complex functions
- Update API documentation
- Include examples in documentation

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── features/    # Feature-specific components
├── db/              # Database schema and queries
├── lib/             # Utility functions
├── server/          # Backend API logic
├── types/           # TypeScript types
└── config/          # Configuration files
```

## Review Process

1. **Automated Checks**
   - CI pipeline runs tests and linting
   - Type checking is performed
   - Build verification

2. **Code Review**
   - At least one maintainer approval required
   - Address review comments
   - Keep PR updated with main branch

3. **Merge**
   - Squash and merge for feature branches
   - Rebase for bug fixes
   - Delete branch after merge

## Getting Help

- Join our [Discord](https://discord.gg/reservone)
- Ask in [Discussions](https://github.com/yourusername/reservone/discussions)
- Email: dev@reservone.com

## Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Given credit in the project

Thank you for contributing to ReservOne! 🎉
