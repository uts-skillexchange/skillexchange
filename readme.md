# Skill Exchange

Skill Exchange is a project by the UTS ICIU that allows users to find talented students with the skills and interests they require.

- Transactional / programmatic email is being sent with SendGrid
- Errors are automatically reported to Rollbar (client and server side)
- We’re using Parse Server as our database middleware. It has already been migrated from the hosted Parse platform
- Our database is hosted by MLab which uses AWS on the backend
- Our file storage is provided by AWS S3 which is linked to our ElasticBeanstalk instance
- Our app is hosted on AWS EC2, initially set up through ElasticBeanstalk
- Our DNS and routing is provided by AWS Route 53
- User Behaviour is reported to Mixpanel
