module.exports =

  initialize: (sessionUserObject) ->

    (req, res, next) ->
      passport = @
      passport._key = 'passport'
      passport._userProperty = 'user'
      passport.serializeUser = (user, done) -> done null, user
      passport.deserializeUser = (user, done) -> done null, user

      req._passport = instance: passport

      req._passport.session = user: sessionUserObject

      next()