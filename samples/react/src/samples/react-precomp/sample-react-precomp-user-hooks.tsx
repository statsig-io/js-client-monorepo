import { useStatsigUser } from '@statsig/react-bindings';

export default async function Sample(): Promise<void> {
  App();
}

// prettier-ignore
function App() {
// <snippet>
const { user, updateUserSync } = useStatsigUser();

return <div>
  <p>Current User: { user.userID }</p>

  <button onClick={() => updateUserSync({userID: 'some-other-user'})}>
    Update User
  </button>
</div>;
// </snippet>
}
