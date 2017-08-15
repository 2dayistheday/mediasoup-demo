import * as actionCreators from './actionCreators';
import RoomClient from '../RoomClient';

export default ({ dispatch }) => (next) =>
{
	let client;

	return (action) =>
	{
		switch (action.type)
		{
			case 'JOIN_ROOM':
			{
				const { peerName, roomId } = action.payload;

				client = new RoomClient({ peerName, roomId, dispatch });

				// TODO: TMP
				global.CLIENT = client;

				break;
			}

			case 'LEAVE_ROOM':
			{
				client.close();

				break;
			}

			case 'MUTE_MIC':
			{
				client.muteMic();

				break;
			}

			case 'UNMUTE_MIC':
			{
				client.unmuteMic();

				break;
			}

			case 'REMOVE_WEBCAM':
			{
				dispatch(actionCreators.setWebcamInProgress(true));
				client.removeWebcam()
					.then(() => dispatch(actionCreators.setWebcamInProgress(false)));

				break;
			}

			case 'ADD_WEBCAM':
			{
				dispatch(actionCreators.setWebcamInProgress(true));
				client.addWebcam()
					.then(() => dispatch(actionCreators.setWebcamInProgress(false)));

				break;
			}
		}

		return next(action);
	};
};
