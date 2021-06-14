import 'source-map-support/register'

import * as uuid from 'uuid'

import { AccessTodos } from '../dataLayer/AccessTodos'
import { StoreTodos } from '../dataLayer/StoreTodos'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const logger = createLogger('todos')

const accessTodos = new AccessTodos()
const storeTodos = new StoreTodos()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  logger.info(`Retrieving all todos for user ${userId}`, { userId })

  return await accessTodos.getTodoItems(userId)
}

export async function createTodo(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  const todoId = uuid.v4()

  const newItem: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: null,
    ...createTodoRequest
  }

  logger.info(`Creating todo ${todoId} for user ${userId}`, {
    userId,
    todoId,
    todoItem: newItem
  })

  await accessTodos.createTodoItem(newItem)

  return newItem
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
) {
  logger.info(`Updating todo ${todoId} for user ${userId}`, {
    userId,
    todoId,
    todoUpdate: updateTodoRequest
  })

  const item = await accessTodos.getTodoItem(todoId)

  if (!item) throw new Error('Item not found') // FIXME: 404?

  if (item.userId !== userId) {
    logger.error(
      `User ${userId} does not have permission to update todo ${todoId}`
    )
    throw new Error('User is not authorized to update item') // FIXME: 403?
  }

  accessTodos.updateTodoItem(todoId, updateTodoRequest as TodoUpdate)
}

export async function deleteTodo(userId: string, todoId: string) {
  logger.info(`Deleting todo ${todoId} for user ${userId}`, { userId, todoId })

  const item = await accessTodos.getTodoItem(todoId)

  if (!item) throw new Error('Item not found') // FIXME: 404?

  if (item.userId !== userId) {
    logger.error(
      `User ${userId} does not have permission to delete todo ${todoId}`
    )
    throw new Error('User is not authorized to delete item') // FIXME: 403?
  }

  accessTodos.deleteTodoItem(todoId)
}

export async function updateAttachmentUrl(
  userId: string,
  todoId: string,
  attachmentId: string
) {
  logger.info(`Generating attachment URL for attachment ${attachmentId}`)

  const attachmentUrl = await storeTodos.getAttachmentUrl(attachmentId)

  logger.info(`Updating todo ${todoId} with attachment URL ${attachmentUrl}`, {
    userId,
    todoId
  })

  const item = await accessTodos.getTodoItem(todoId)

  if (!item) throw new Error('Item not found') // FIXME: 404?

  if (item.userId !== userId) {
    logger.error(
      `User ${userId} does not have permission to update todo ${todoId}`
    )
    throw new Error('User is not authorized to update item') // FIXME: 403?
  }

  await accessTodos.updateAttachmentUrl(todoId, attachmentUrl)
}

export async function generateUploadUrl(attachmentId: string): Promise<string> {
  logger.info(`Generating URL for attachment ${attachmentId}`)

  const uploadUrl = await storeTodos.getUploadUrl(attachmentId)

  return uploadUrl
}
