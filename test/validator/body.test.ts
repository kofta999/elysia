import { Elysia, t } from '../../src'

import { describe, expect, it } from 'bun:test'
import { post } from '../utils'

describe('Body Validator', () => {
	it('validate single', async () => {
		const app = new Elysia().post('/', ({ body: { name } }) => name, {
			body: t.Object({
				name: t.String()
			})
		})
		const res = await app.handle(
			post('/', {
				name: 'sucrose'
			})
		)

		expect(await res.text()).toBe('sucrose')
		expect(res.status).toBe(200)
	})

	it('validate multiple', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.String()
			})
		})
		const res = await app.handle(
			post('/', {
				name: 'sucrose',
				job: 'alchemist',
				trait: 'dog'
			})
		)

		expect(await res.json()).toEqual({
			name: 'sucrose',
			job: 'alchemist',
			trait: 'dog'
		})
		expect(res.status).toBe(200)
	})

	it('parse without reference', async () => {
		const app = new Elysia().post('/', () => '', {
			body: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.String()
			})
		})
		const res = await app.handle(
			post('/', {
				name: 'sucrose',
				job: 'alchemist',
				trait: 'dog'
			})
		)

		expect(res.status).toBe(200)
	})

	it('validate optional', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.Optional(t.String())
			})
		})
		const res = await app.handle(
			post('/', {
				name: 'sucrose',
				job: 'alchemist'
			})
		)

		expect(await res.json()).toEqual({
			name: 'sucrose',
			job: 'alchemist'
		})
		expect(res.status).toBe(200)
	})

	it('parse single numeric', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.Optional(t.String()),
				age: t.Numeric()
			})
		})
		const res = await app.handle(
			post('/', {
				name: 'sucrose',
				job: 'alchemist',
				age: '16'
			})
		)

		expect(await res.json()).toEqual({
			name: 'sucrose',
			job: 'alchemist',
			age: 16
		})
		expect(res.status).toBe(200)
	})

	it('parse multiple numeric', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Object({
				name: t.String(),
				job: t.String(),
				trait: t.Optional(t.String()),
				age: t.Numeric(),
				rank: t.Numeric()
			})
		})
		const res = await app.handle(
			post('/', {
				name: 'sucrose',
				job: 'alchemist',
				age: '16',
				rank: '4'
			})
		)

		expect(await res.json()).toEqual({
			name: 'sucrose',
			job: 'alchemist',
			age: 16,
			rank: 4
		})
		expect(res.status).toBe(200)
	})

	it('validate empty body', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Union([
				t.Undefined(),
				t.Object({
					name: t.String(),
					job: t.String(),
					trait: t.Optional(t.String())
				})
			])
		})
		const res = await app.handle(
			new Request('http://localhost/', {
				method: 'POST'
			})
		)

		expect(res.status).toBe(200)
		expect(await res.text()).toBe('')
	})

	it('validate empty body with partial', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Union([
				t.Undefined(),
				t.Object({
					name: t.String(),
					job: t.String(),
					trait: t.Optional(t.String()),
					age: t.Numeric(),
					rank: t.Numeric()
				})
			])
		})
		const res = await app.handle(
			new Request('http://localhost/', {
				method: 'POST'
			})
		)

		expect(res.status).toBe(200)
		expect(await res.text()).toEqual('')
	})

	it('strictly validate by default', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Object({
				name: t.String()
			})
		})

		const res = await app.handle(
			post('/', {
				name: 'sucrose',
				job: 'alchemist'
			})
		)

		expect(res.status).toBe(422)
	})

	it('validate maybe empty body', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.MaybeEmpty(
				t.Object({
					name: t.String(),
					job: t.String(),
					trait: t.Optional(t.String())
				})
			)
		})
		const res = await app.handle(
			new Request('http://localhost/', {
				method: 'POST'
			})
		)

		expect(res.status).toBe(200)
		expect(await res.text()).toBe('')
	})

	it('validate record', async () => {
		const app = new Elysia().post('/', ({ body: { name } }) => name, {
			body: t.Record(t.String(), t.String())
		})
		const res = await app.handle(
			post('/', {
				name: 'sucrose'
			})
		)

		expect(await res.text()).toBe('sucrose')
		expect(res.status).toBe(200)
	})

	it('validate record inside object', async () => {
		const app = new Elysia().post(
			'/',
			({ body: { name, friends } }) =>
				`${name} ~ ${Object.keys(friends).join(' + ')}`,
			{
				body: t.Object({
					name: t.String(),
					friends: t.Record(t.String(), t.String())
				})
			}
		)
		const res = await app.handle(
			post('/', {
				name: 'sucrose',
				friends: {
					amber: 'wizard',
					lisa: 'librarian'
				}
			})
		)

		expect(await res.text()).toBe('sucrose ~ amber + lisa')
		expect(res.status).toBe(200)
	})

	it('create default object body', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.Object({
				username: t.String(),
				password: t.String(),
				email: t.Optional(t.String({ format: 'email' })),
				isSuperuser: t.Boolean({ default: false })
			})
		})

		const value = await app.handle(
			post('/', {
				username: 'nagisa',
				password: 'hifumi_daisuki',
				email: 'kirifuji_nagisa@trinity.school'
			})
		)
			.then((x) => x.json())

		expect(value).toEqual({
			username: 'nagisa',
			password: 'hifumi_daisuki',
			email: 'kirifuji_nagisa@trinity.school',
			isSuperuser: false
		})
	})

	it('create default string body', async () => {
		const app = new Elysia().post('/', ({ body }) => body, {
			body: t.String({ default: 'hifumi_daisuki' })
		})

		const value = await app.handle(
			post('/')
		)
			.then((x) => x.text())

		expect(value).toBe('hifumi_daisuki')
	})

	it('create default boolean body', async () => {
		const app = new Elysia().post('/', ({ body }) => typeof body, {
			body: t.Boolean({ default: true })
		})

		const value = await app.handle(
			post('/')
		)
			.then((x) => x.text())

		expect(value).toBe('boolean')
	})

	it('create default number body', async () => {
		const app = new Elysia().post('/', ({ body }) => typeof body, {
			body: t.Number({ default: 1 })
		})

		const value = await app.handle(
			post('/')
		)
			.then((x) => x.text())

		expect(value).toBe('number')
	})

	it('create default numeric body', async () => {
		const app = new Elysia().post('/', ({ body }) => typeof body, {
			body: t.Numeric({ default: 1 })
		})

		const value = await app.handle(
			post('/')
		)
			.then((x) => x.text())

		expect(value).toBe('number')
	})
})
