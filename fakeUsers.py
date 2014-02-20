import json
import string
import random
from faker import Factory
from random import randrange
rom random import choice
f = Factory.create()

billing_roles = ['N/A', 'Add Services']


def randompassword():
  chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
  size = random.randint(8, 12)
  return ''.join(random.choice(chars) for x in range(size))

response = []
for i in range(100):
  contacts = []
  company = f.company();
  domain = company.split(' ')[0].strip(',').lower() + '.' + f.domain_name().split('.')[1]
  for t in range(randrange(1,5)):
    password = randompassword();
    first = f.first_name();
    last = f.last_name(); 
    username = first[0].lower() + last.lower();
    contact = {'name': first + ' ' + last, 'username': username, 'email': username + '@' + domain, 'phone': f.phone_number(), 'password': password }
    contacts.append(contact) 
  company = {'company': company, 'catch_phrase': f.catch_phrase(), 'keywords': f.bs(), 'domain': domain, 'phone': f.phone_number(), 'address1': f.street_address(), 'address2': f.secondary_address(), 'city': f.city(), 'state': f.state(), 'zip': f.postcode(), 'contacts': contacts, 'phone': f.phone_number()}
  response.append(company)
print json.dumps(response)
