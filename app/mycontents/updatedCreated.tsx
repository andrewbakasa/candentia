import moment from "moment";

interface DatesProps {
  createdAt: string,
  updatedAt: string
}

const CreatedAtUpdatedAt: React.FC<DatesProps> = ({
        createdAt,
        updatedAt
      }) => {
 const notSameDate = moment(createdAt).fromNow()!== moment(updatedAt).fromNow()
    
  return (
    
    <div className="flex justify-between">
        <span className='flex gap-2 text-sm text-gray-700 '>{'cre '} {moment(createdAt).fromNow()}</span> 
        {notSameDate && <span className='flex gap-2 text-sm text-blue-700 '>{'upd '} {moment(updatedAt).fromNow()}</span> }
    </div>
  );
};

export default CreatedAtUpdatedAt;


