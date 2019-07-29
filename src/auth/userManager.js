/*

The idea here is to do authentication through firebase. This is an alternative
to using the json-server-auth package, but there are tradeoffs
for both.

Here is the workflow:

REGISTER
1) Get username and password from a form and submit it to firebase auth
2) Firebase will register the new user and return a uid for that user
3) Take the uid from firebase and whatever profile info you need and save a record to json-server

```
{
  username: 'Adam',
  email: 'adam.nss@gmail.com'
  bio: 'lots of interesting facts...'
  id: <uid from firebase>
}
```

4) Save record to local/session storage
5) Update 'user' state in your react app

LOGIN
1) Get username and password from login and log into firebase
2) Firebase will return an existing user with his/her uid
3) Use the firebase uid to make a GET call to json-server for the profile info
4) Save record to local/session storage
5) update 'user' state in your react app

LOGOUT
1) Logout from firebase
2) Remove record from local/session storage
3) update 'user' state in your react app to null


PROS
- Students don't have to manage user passwords

- Allows students to easily add auth providers like google with not
much more effort

- Easier learning curve. The json-server-auth package might invite
too many questions about express and jwt's. Although there is an extra
step in this workflow, it's not adding anything to their codebase that they
haven't already seen


CONS
- Although user passwords are secure, their data won't be. The json-server-auth
packages uses jwt's to protect certain routes. Any user with knowledge of another
user's uid could technically change the values in their local storage and pretend
to be the other user.

*/

  import * as firebase from 'firebase/app'
  import "firebase/auth"

const url = 'http://localhost:8088/users';

const setUserInSessionStorage = (user) => {
  sessionStorage.setItem('user', JSON.stringify(user));
}

export const saveUserToJsonServer = (user) => {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  })
    .then(res => res.json())
    .then(newUser => {
      setUserInSessionStorage(newUser);
      return newUser;
    });
}


export const getUser = (userId) => {
  return fetch(`${url}/${userId}`)
    .then(res => res.json());
}

export const login = (email) => {
  // NOTE: json-server will return an array, but we only expect one or none users to come back so we just take the first one
  return fetch(`${url}?email=${email}`)
    .then(res => res.json())
    .then(matchingUsers => {
      if (!matchingUsers.length) {
        alert('No user exists with that email address');
        return;
      }
      const user = matchingUsers[0];
      setUserInSessionStorage(user);
      return user;
    });
}

export const getUserFromSessionStorage = () => {
  const user = sessionStorage.getItem('user');

  if (!user) return null;

  return JSON.parse(user);
}
//this method should do all the login things
//it should return a promise that only resolves after all these things happen
//1. send email and password to firebase
//2. On success, accept the user id
//3. Use userId to grab user object from JSON server
//4. Save user to session storage
export const loginUser = (email, password) => {
  return firebase.auth().signInWithEmailAndPassword(email, password)
  .then(data => data.user.uid)
  .then(userId => getUser(userId)
  .then(user => {
    setUserInSessionStorage(user);
    return user;
  })
  )
}

export const logout = () => {
  sessionStorage.removeItem('user');
}

//this method should do all the registering things
//it should return a promise that only resolves after all these things happen
//1. send email and password to firebase
//2. accept the user id that firebase gives back to us
//3. Add that user id to the user object and delete the password
//4. send to JSON server
export const register = (userForm) => {
  return firebase.auth().createUserWithEmailAndPassword(userForm.email, userForm.password) //this is a promise
  .then(data => data.user.uid)
  .then(userId => {
    userForm.id = userId;
    delete userForm.password;
    return saveUserToJsonServer(userForm);
  })
}