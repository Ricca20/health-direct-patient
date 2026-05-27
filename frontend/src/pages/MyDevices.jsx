import { useEffect, useState } from "react";
import { Monitor, Smartphone, Tablet, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  getCurrentDeviceId,
  getMyDevices,
  revokeDeviceSession,
  revokeOtherDeviceSessions,
} from "../utils/api";

const iconForType = (type) => {
  const normalized = (type || "").toLowerCase();
  if (normalized === "mobile") return Smartphone;
  if (normalized === "tablet") return Tablet;
  return Monitor;
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const MyDevices = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const currentDeviceId = getCurrentDeviceId();

  const fetchDevices = async () => {
    try {
      const response = await getMyDevices();
      setDevices(Array.isArray(response?.data?.devices) ? response.data.devices : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRevoke = async (id) => {
    try {
      await revokeDeviceSession(id);
      toast.success("Device revoked successfully");
      setDevices((prev) => prev.filter((d) => d._id !== id));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to revoke device");
    }
  };

  const handleRevokeOthers = async () => {
    try {
      await revokeOtherDeviceSessions(currentDeviceId);
      toast.success("Other devices revoked");
      fetchDevices();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to revoke other devices");
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#0a2e5d]">My Devices</h1>
            <p className="text-gray-500 text-sm mt-1">Manage trusted devices and active sessions</p>
          </div>
          <button
            type="button"
            onClick={handleRevokeOthers}
            className="px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer"
          >
            Revoke Other Devices
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading devices...</p>
        ) : devices.length === 0 ? (
          <p className="text-gray-500">No active devices found.</p>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const DeviceIcon = iconForType(device.deviceType);
              const isCurrent = device.deviceId === currentDeviceId || device.isCurrent;

              return (
                <div
                  key={device._id}
                  className="border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0a2e5d] flex items-center justify-center">
                      <DeviceIcon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">
                          {device.browser || "Unknown Browser"} • {device.os || "Unknown OS"}
                        </p>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Current</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {device.deviceType || "device"} | IP: {device.ipAddress || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        First seen: {formatDate(device.firstUsedAt)} | Last login: {formatDate(device.lastLoginAt)}
                      </p>
                    </div>
                  </div>

                  {!isCurrent ? (
                    <button
                      type="button"
                      onClick={() => handleRevoke(device._id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 size={14} /> Revoke
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-700 bg-blue-50">
                      <ShieldAlert size={14} /> Active Session
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDevices;
