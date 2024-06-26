import { Context, Elysia, t } from '../../src'

import { describe, expect, it } from 'bun:test'
import { req } from '../utils'

describe('Query Validator', () => {
	it('validate single', async () => {
		const app = new Elysia().get('/', ({ query: { name } }) => name, {
			query: t.Object({
				name: t.String()
			})
		})
		const res = await app.handle(req('/?name=sucrose'))

		expect(await res.text()).toBe('sucrose')
		expect(res.status).toBe(200)
	})

	it('validate with hyphen in key', async () => {
		const app = new Elysia().get(
			'/',
			({ query }) => query['character-name'],
			{
				query: t.Object({
					'character-name': t.String()
				})
			}
		)
		const res = await app.handle(req('/?character-name=sucrose'))

		expect(await res.text()).toBe('sucrose')
		expect(res.status).toBe(200)
	})

	it('validate with dot in key', async () => {
		const app = new Elysia().get(
			'/',
			({ query }) => query['character.name'],
			{
				query: t.Object({
					'character.name': t.String()
				})
			}
		)
		const res = await app.handle(req('/?character.name=sucrose'))

		expect(await res.text()).toBe('sucrose')
		expect(res.status).toBe(200)
	})

	it('validate multiple', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.String()
			})
		})
		const res = await app.handle(
			req('/?name=sucrose&job=alchemist&trait=dog')
		)

		expect(await res.json()).toEqual({
			name: 'sucrose',
			job: 'alchemist',
			trait: 'dog'
		})
		expect(res.status).toBe(200)
	})

	it('parse without reference', async () => {
		const app = new Elysia().get('/', () => '', {
			query: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.String()
			})
		})
		const res = await app.handle(
			req('/?name=sucrose&job=alchemist&trait=dog')
		)

		expect(res.status).toBe(200)
	})

	it('validate optional', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.Optional(t.String())
			})
		})
		const res = await app.handle(req('/?name=sucrose&job=alchemist'))

		expect(await res.json()).toEqual({
			name: 'sucrose',
			job: 'alchemist'
		})
		expect(res.status).toBe(200)
	})

	it('parse single numeric', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.Optional(t.String()),
				age: t.Numeric()
			})
		})
		const res = await app.handle(req('/?name=sucrose&job=alchemist&age=16'))

		expect(await res.json()).toEqual({
			name: 'sucrose',
			job: 'alchemist',
			age: 16
		})
		expect(res.status).toBe(200)
	})

	it('parse multiple numeric', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.Optional(t.String()),
				age: t.Numeric(),
				rank: t.Numeric()
			})
		})
		const res = await app.handle(
			req('/?name=sucrose&job=alchemist&age=16&rank=4')
		)

		expect(await res.json()).toEqual({
			name: 'sucrose',
			job: 'alchemist',
			age: 16,
			rank: 4
		})
		expect(res.status).toBe(200)
	})

	it('validate partial', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Partial(
				t.Object({
					name: t.String(),
					job: t.String(),
					trait: t.Optional(t.String())
				})
			)
		})
		const res = await app.handle(req('/'))

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({})
	})

	it('parse numeric with partial', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Partial(
				t.Object({
					name: t.String(),
					job: t.String(),
					trait: t.Optional(t.String()),
					age: t.Numeric(),
					rank: t.Numeric()
				})
			)
		})
		const res = await app.handle(req('/'))

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({})
	})

	it('parse boolean string', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Object({
				param1: t.BooleanString()
			})
		})
		const res = await app.handle(req('/?param1=true'))

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ param1: true })
	})

	it('parse optional boolean string', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Object({
				param1: t.Optional(t.BooleanString({ default: true }))
			})
		})
		const res = await app.handle(req('/'))

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ param1: true })
	})

	it('create default string query', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Object({
				name: t.String(),
				faction: t.String({ default: 'tea_party' })
			})
		})

		const value = await app
			.handle(req('/?name=nagisa'))
			.then((x) => x.json())

		expect(value).toEqual({
			name: 'nagisa',
			faction: 'tea_party'
		})
	})

	it('create default number query', async () => {
		const app = new Elysia().get('/', ({ query }) => query, {
			query: t.Object({
				name: t.String(),
				rank: t.Number({ default: 1 })
			})
		})

		const value = await app
			.handle(req('/?name=nagisa'))
			.then((x) => x.json())

		expect(value).toEqual({
			name: 'nagisa',
			rank: 1
		})
	})

	it('handle query edge case', async () => {
		const checker = {
			check(ctx: Context, name: string, state?: string) {
				return typeof state !== 'undefined'
			}
		}

		const app = new Elysia()
			.derive((ctx) => {
				const { name } = ctx.params

				return {
					check() {
						const { state } = ctx.query

						if (!checker.check(ctx, name, state ?? ctx.query.state))
							throw new Error('State mismatch')
					}
				}
			})
			.get('/:name', ({ check }) => {
				check()

				return 'yay'
			})

		const response = await app
			.handle(req('/a?state=123'))
			.then((x) => x.text())

		expect(response).toBe('yay')
	})

	it('parse query object', async () => {
		const app = new Elysia()
			.get('/', ({ query }) => query, {
				query: t.Optional(
					t.Object({
						role: t.Optional(
							t.Array(
								t.Object({
									name: t.String()
								})
							)
						)
					})
				)
			})
			.compile()

		const response = await app
			.handle(
				req(
					`/?role=${JSON.stringify([
						{ name: 'hello' },
						{ name: 'world' }
					])}`
				)
			)
			.then((x) => x.json())

		expect(response).toEqual({
			role: [{ name: 'hello' }, { name: 'world' }]
		})
	})
})
