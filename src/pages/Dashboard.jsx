import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  DatePicker,
  Select,
  Empty,
  Modal,
  Spin,
  message,
} from "antd";
import {
  fetchLaunches,
  fetchLaunchpads,
  fetchRockets,
  fetchPayloads,
} from "../api/spacex";
import moment from "moment";
import "antd/dist/reset.css";
import { FilterOutlined } from '@ant-design/icons';


const { RangePicker } = DatePicker;
const { Option } = Select;

const statusColors = { success: "green", failed: "red", upcoming: "orange" };

const presetRanges = {
  "Past week": [moment().subtract(7, "days"), moment()],
  "Past month": [moment().subtract(1, "month"), moment()],
  "Past 3 months": [moment().subtract(3, "months"), moment()],
  "Past 6 months": [moment().subtract(6, "months"), moment()],
  "Past year": [moment().subtract(1, "year"), moment()],
  "Past 2 years": [moment().subtract(2, "years"), moment()],
};

const Dashboard = () => {
  const [launchData, setLaunchData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All Launches");
  const [dateRange, setDateRange] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [launchRes, launchpadsRes, rocketsRes, payloadsRes] =
          await Promise.all([
            fetchLaunches(),
            fetchLaunchpads(),
            fetchRockets(),
            fetchPayloads(),
          ]);

        const launchpadsMap = {};
        launchpadsRes.data.forEach((pad) => {
          launchpadsMap[pad.id] = pad.name;
        });

        const rocketsMap = {};
        rocketsRes.data.forEach((rocket) => {
          rocketsMap[rocket.id] = rocket.name;
        });

        const payloadsMap = {};
        payloadsRes.data.forEach((payload) => {
          payloadsMap[payload.id] = payload.orbit || "Unknown";
        });

        const mappedData = launchRes.data.map((launch) => {
          let orbit = "Unknown";
          if (launch.payloads && launch.payloads.length > 0) {
            orbit = payloadsMap[launch.payloads[0]] || "Unknown";
          }

          return {
            key: launch.id,
            no: launch.flight_number,
            launchDate: launch.date_utc,
            location: launchpadsMap[launch.launchpad] || "Unknown",
            mission: launch.name,
            orbit,
            status: launch.upcoming
              ? "Upcoming"
              : launch.success
              ? "Success"
              : "Failed",
            rocket: rocketsMap[launch.rocket] || "Unknown",
            details: launch.details,
            links: launch.links,
          };
        });

        setLaunchData(mappedData);
        setFilteredData(mappedData);
      } catch (error) {
        console.error(error);
        message.error("Failed to fetch SpaceX data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...launchData];
    if (selectedStatus !== "All Launches") {
      result = result.filter(
        (item) => item.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    if (dateRange.length === 2) {
      result = result.filter((item) => {
        const date = moment(item.launchDate);
        return date.isBetween(dateRange[0], dateRange[1], null, "[]");
      });
    }
    setFilteredData(result);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [selectedStatus, dateRange, launchData]);

  const handleTableChange = (pag) => {
    setPagination(pag);
  };

const columns = [
  { title: "No.", dataIndex: "no", align: "center", width: 70 },
  {
    title: "Launched",
    dataIndex: "launchDate",
    align: "center",
    render: (date) => moment(date).format("DD MMM YYYY HH:mm"),
    width: 150,
  },
  { title: "Location", dataIndex: "location", align: "center", width: 120 },
  {
    title: "Mission",
    dataIndex: "mission",
    align: "center",
    width: 120, 
    ellipsis: true,
  },
  { title: "Orbit", dataIndex: "orbit", align: "center", width: 100 },
  {
    title: "Status",
    dataIndex: "status",
    align: "center",
    render: (status) => (
      <Tag color={statusColors[status.toLowerCase()]}>{status}</Tag>
    ),
    width: 100,
  },
  { title: "Rocket", dataIndex: "rocket", align: "center", width: 120 },
];

  return (
    <div className="p-2 sm:p-3 md:p-4 min-h-screen flex flex-col items-center">
      <div className="bg-white flex flex-col mb-2 sm:mb-3 md:mb-4 shadow w-full justify-center items-center p-2 sm:p-3">
        <img
          src="/spacex_logo.png"
          alt="SpaceX Logo"
          className="w-32 sm:w-40 md:w-60 mb-1 object-contain"
        />
      </div>

      <div className="w-full md:w-[80%] mx-auto mb-2 sm:mb-3 md:mb-4 bg-white p-2 sm:p-3 rounded-md">
        <div className="flex flex-col md:flex-row gap-2 sm:gap-3 justify-between items-center">
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates || [])}
            format="DD-MM-YYYY"
            className="w-full md:w-auto text-xs sm:text-sm"
            ranges={presetRanges}
          />
          <div className="flex items-center w-60 md:w-60">
  <FilterOutlined className="text-gray-500 text-base" />
  <Select
    value={selectedStatus}
    onChange={setSelectedStatus}
     bordered={false}
    className="flex-1 text-xs sm:text-sm"
  >
    <Option value="All Launches">All Launches</Option>
    <Option value="Success">Successful Launches</Option>
    <Option value="Failed">Failed Launches</Option>
    <Option value="Upcoming">Upcoming Launches</Option>
  </Select>
</div>
        </div>
      </div>

      <div className="w-full md:w-[80%] overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-4">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="key"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              total: filteredData.length,
            }}
            onChange={handleTableChange}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: (
                <Empty description="No results found for the specified filter." />
              ),
            }}
            bordered
            size="small"
            onRow={(record) => ({ onClick: () => setModalData(record) })}
          />
        )}
      </div>

      <Modal
        open={!!modalData}
        onCancel={() => setModalData(null)}
        footer={null}
        centered
      >
        {modalData && (
          <div className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <img
                src={
                  modalData.links?.patch?.small ||
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/SpaceX_CRS-1_Patch.png/480px-SpaceX_CRS-1_Patch.png"
                }
                alt="Mission Patch"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded object-contain"
              />
              <div className="flex flex-col text-center sm:text-left">
                <h2 className="text-sm sm:text-base font-semibold">
                  {modalData.mission}
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {modalData.rocket}
                </span>
                <Tag
                  color={statusColors[modalData.status.toLowerCase()]}
                  className="w-fit mx-auto sm:mx-0 mt-1"
                >
                  {modalData.status}
                </Tag>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-700">
              {modalData.details || "No mission details available."}
            </p>
            <div className="flex flex-col border rounded-md overflow-hidden">
              {[
                { label: "Flight Number", value: modalData.no },
                { label: "Mission Name", value: modalData.mission },
                { label: "Rocket", value: modalData.rocket },
                {
                  label: "Launch Date",
                  value: moment(modalData.launchDate).format(
                    "DD MMM YYYY HH:mm"
                  ),
                },
                { label: "Orbit", value: modalData.orbit },
                { label: "Status", value: modalData.status , style: { font: 'bold' }},
                { label: "Launch Site", value: modalData.location },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between px-3 py-1 ${
                    idx !== 0 ? "border-t" : ""
                  }`}
                >
                  <span className="text-gray-600">{item.label}</span>
                  <span className="text-gray-800 font-medium text-right">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
