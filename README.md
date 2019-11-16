# nextpress-context

**What this does**

  - Merges environment variables from an `envfile.env` and the environment;
  - Specify required environment variables. Throws on not found;
  - Allow alternate envfiles for multiple environments;
  - Remap env keys to JS objects;
  - Suggests a default way to integrate those keys to typescript;

## Declare a context mapper

```ts
export const jwtContext = createContextMapper({
  id: 'default.jwt',
  envKeys: ['JWT_SECRET'],
  optionalKeys: [],
  envContext({ getKey }) {
    return {
      jwt: {
        secret: getKey('JWT_SECRET')!,
      },
    }
  },
})
```

## Add it to the global context type

```ts
declare global {
  namespace Nextpress {
    interface CustomContext extends ReturnType<typeof jwtContext['envContext']> {}
  }
}
```

Type is available through `Nextpress.Context`.

## Declare the application context

```ts
const ctx = ContextFactory({
  //withPrefix: '...',
  projectRoot: __dirname,
  mappers: [jwtContext],
})

console.log(ctx.jwt.secret)
```

- Requires `JWT_SECRET` to be either in the environment variables or in `envfile.env` file;
- Unless `NO_ENVFILE` environment variable is set, throws
  if `envfile.env` does not exist. Also, creates a new preset `envfile.env` according to the required variables
- If `withPrefix` is set, requires variables from a different envfile, `<prefix>envfile.env`. Also requires uppercase prefix to be prepended to each environment variable.
