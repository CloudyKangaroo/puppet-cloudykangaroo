module.exports =

  initialize: () ->

    (req, res, next) ->
      passport = @
      passport._key = 'passport'
      passport._userProperty = 'currentUser'
      passport.serializeUser = (user, ptp, done) -> done null, user
      passport.deserializeUser = (user, ptp, done) -> done null, user

      req._passport = instance: passport
      req._passport.session = user: require('./db').users.syncfindByUsername('test')

      next()