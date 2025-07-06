import React, { useEffect, useState } from "react";
import { Table, Tag, DatePicker, Select, Empty, Modal } from "antd";
import "antd/dist/reset.css";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Option } = Select;

const dummyData = [
  { key: "1", no: "01", launchDate: "2006-03-24T22:30:00Z", location: "Kwajalein Atoll", mission: "FalconSat", orbit: "LEO", status: "Failed", rocket: "Falcon 9" },
  { key: "2", no: "02", launchDate: "2008-09-28T23:15:00Z", location: "Kwajalein Atoll", mission: "RatSat", orbit: "LEO", status: "Success", rocket: "Falcon 9" },
  { key: "3", no: "03", launchDate: "2025-12-10T16:00:00Z", location: "KSC LC 39A", mission: "CRS-21", orbit: "ISS", status: "Upcoming", rocket: "Falcon 9" },
];

const statusColors = { Success: "green", Failed: "red", Upcoming: "orange" };

const presetRanges = {
  "Past week": [moment().subtract(7, "days"), moment()],
  "Past month": [moment().subtract(1, "month"), moment()],
  "Past 3 months": [moment().subtract(3, "months"), moment()],
  "Past 6 months": [moment().subtract(6, "months"), moment()],
  "Past year": [moment().subtract(1, "year"), moment()],
  "Past 2 years": [moment().subtract(2, "years"), moment()],
};

const Dashboard = () => {
  const [filteredData, setFilteredData] = useState(dummyData);
  const [selectedStatus, setSelectedStatus] = useState("All Launches");
  const [dateRange, setDateRange] = useState([]);
  const [modalData, setModalData] = useState(null);

  useEffect(() => { filterData(); }, [selectedStatus, dateRange]);

  const filterData = () => {
    let result = [...dummyData];
    if (selectedStatus !== "All Launches") {
      result = result.filter((item) => item.status === selectedStatus);
    }
    if (dateRange.length === 2) {
      result = result.filter((item) => {
        const date = moment(item.launchDate);
        return date.isBetween(dateRange[0], dateRange[1], null, "[]");
      });
    }
    setFilteredData(result);
  };

  const handleRangeChange = (dates) => { setDateRange(dates || []); };

  const columns = [
    { title: "No.", dataIndex: "no" },
    { title: "Launched (UTC)", dataIndex: "launchDate", render: (date) => moment(date).format("DD MMMM YYYY HH:mm") },
    { title: "Location", dataIndex: "location" },
    { title: "Mission", dataIndex: "mission" },
    { title: "Orbit", dataIndex: "orbit" },
    { title: "Launch Status", dataIndex: "status", render: (status) => (<Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>) },
    { title: "Rocket", dataIndex: "rocket" },
  ];

  return (
    <div className="p-4 min-h-screen bg-gray-100 dark:bg-[#0E1013] flex flex-col items-center">
      {/* Centered SpaceX header with corrected image path */}
      <div className="bg-white flex flex-col mb-2 shadow-md w-full justify-center items-center">
      <img src="/spacex_logo.png" alt="SpaceX Logo" className="w-48 md:w-60 mb-4 object-contain" />
</div>
      <div className="w-full md:w-[80%] md:mt-4 mx-auto mb-2 bg-white p-4 rounded-md ">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <RangePicker
            value={dateRange}
            onChange={handleRangeChange}
            format="DD-MM-YYYY"
            className="w-full md:w-auto"
            ranges={presetRanges}
          />
          <Select value={selectedStatus} onChange={setSelectedStatus} className="w-full md:w-60">
            <Option value="All Launches">All Launches</Option>
            <Option value="Success">Successful Launches</Option>
            <Option value="Failed">Failed Launches</Option>
            <Option value="Upcoming">Upcoming Launches</Option>
          </Select>
        </div>
      </div>

      <div className="flex justify-center mb-4 w-full">
        <Table
          columns={columns}
          dataSource={filteredData}
          onRow={(record) => ({ onClick: () => setModalData(record) })}
          locale={{ emptyText: (<Empty description="No results found for the specified filter" />) }}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          rowKey="key"
          className="bg-white dark:bg-[#202124] shadow rounded-lg w-full md:w-[80%] "
          bordered
        />
      </div>

      <Modal
        title={modalData?.mission || "Launch Details"}
        open={!!modalData}
        onCancel={() => setModalData(null)}
        footer={null}
        centered
      >
        {modalData && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center gap-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/SpaceX_CRS-1_Patch.png/480px-SpaceX_CRS-1_Patch.png"
                alt="Mission Patch"
                className="w-16 h-16 rounded"
              />
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">{modalData.mission}</h2>
                <span className="text-sm text-gray-500">{modalData.rocket}</span>
                <Tag color={statusColors[modalData.status]}>{modalData.status}</Tag>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300">
              Sample mission description placeholder. Replace with real API data for production.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 dark:bg-[#1B1D22] p-4 rounded-md">
              <div><strong>Flight Number:</strong> {modalData.no}</div>
              <div><strong>Mission Name:</strong> {modalData.mission}</div>
              <div><strong>Rocket Type:</strong> Falcon 9</div>
              <div><strong>Rocket Name:</strong> {modalData.rocket}</div>
              <div><strong>Manufacturer:</strong> SpaceX</div>
              <div><strong>Nationality:</strong> USA</div>
              <div><strong>Launch Date:</strong> {moment(modalData.launchDate).format("DD MMMM YYYY HH:mm")}</div>
              <div><strong>Payload Type:</strong> Dragon</div>
              <div><strong>Orbit:</strong> {modalData.orbit}</div>
              <div><strong>Launch Site:</strong> {modalData.location}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;