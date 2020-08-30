const logger = require('../utils/logger')
const userQuery = require('../models/users')

/**
 * Fetches the data about our users
 *
 * @param req {Object} - Express request object
 * @param res {Object} - Express response object
 */

const getUsers = async (req, res) => {
  try {
    const allUsers = await userQuery.fetchUsers(req.query)

    if (allUsers.length) {
      res.json({
        message: 'Users returned successfully!',
        users: allUsers
      })
      return
    }

    res.boom.notFound('No users available')
  } catch (error) {
    logger.error(`Error while fetching all users: ${error}`)
    res.boom.serverUnavailable('Something went wrong please contact admin')
  }
}

/**
 * Fetches the data about user with given id
 *
 * @param req {Object} - Express request object
 * @param res {Object} - Express response object
 */

const getUser = async (req, res) => {
  try {
    const user = await userQuery.fetchUser(req.params.id)

    if (user) {
      res.json({
        message: 'User returned successfully!',
        user
      })
      return
    }

    res.boom.notFound('User doesn\'t exist')
  } catch (error) {
    logger.error(`Error while fetching user: ${error}`)
    res.boom.serverUnavailable('Something went wrong please contact admin')
  }
}

/**
 * Add new user
 *
 * @param req {Object} - Express request object
 * @param req.body {Object} - User object
 * @param res {Object} - Express response object
 */
const addNewUser = async (req, res) => {
  try {
    const user = await userQuery.addUser(req.body)
    if (user.isNewUser) {
      res.json({
        message: 'User added successfully!',
        userId: user.userId
      })
      return
    }

    res.boom.badRequest('User already exists')
  } catch (error) {
    logger.error(`Error while creating new user: ${error}`)
    res.boom.serverUnavailable('Something went wrong please contact admin')
  }
}

/**
 * Update user
 *
 * @param req {Object} - Express request object
 * @param req.params.id {string} - User id
 * @param req.body {Object} - User object
 * @param res {Object} - Express response object
 */
const updateUser = async (req, res) => {
  try {
    const user = await userQuery.updateUser(req.params.id, req.body)
    if (user.userExists) {
      res.json({
        message: 'User updated successfully!'
      })
      return
    }

    res.boom.badRequest('User not found')
  } catch (error) {
    logger.error(`Error while updating user: ${error}`)
    res.boom.serverUnavailable('Something went wrong please contact admin')
  }
}

module.exports = {
  addNewUser,
  updateUser,
  getUsers,
  getUser
}
